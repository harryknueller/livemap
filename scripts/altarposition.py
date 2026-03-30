import argparse
import json
import re
import struct
from scapy.all import sniff, TCP

CHANNEL_PORTS = (6061, 6062, 6063, 6064)
PAYLOAD_MIN_LENGTH = 80
COORD_MARKER = b"\x01\x04\x00\x00\x00"
NAME_FIELD_PREFIX = COORD_MARKER
ALLOWED_ALTAR_TYPES = {1, 2}
HEX_LIKE_PATTERN = re.compile(r"^[0-9a-fA-F]{8,}$")
HEX_TOKEN_PATTERN = re.compile(r"[0-9a-fA-F]{10,32}")
BRACKET_ERROR_PATTERN = re.compile(r"^\[\s*error\s*\]$", re.IGNORECASE)
SEEN_ALTARS = set()
DEBUG_SAMPLE_LIMIT = 40
DEBUG_SAMPLE_COUNT = 0


def get_channel_port(tcp_layer):
    if tcp_layer.sport in CHANNEL_PORTS:
        return int(tcp_layer.sport)
    if tcp_layer.dport in CHANNEL_PORTS:
        return int(tcp_layer.dport)
    return None


def decode_area_name(raw_name):
    name = raw_name.decode("utf-8", errors="ignore").replace("\x00", "").strip()
    return " ".join(name.split())


def is_probable_altar_name(name):
    if not name or len(name) < 2 or len(name) > 96:
        return False

    if HEX_LIKE_PATTERN.fullmatch(name):
        return False

    if BRACKET_ERROR_PATTERN.fullmatch(name):
        return False

    if any(ord(char) < 32 for char in name):
        return False

    cleaned = name.strip()
    if cleaned.lower() in {"error", "[error]", "null", "none", "unknown"}:
        return False

    alpha_count = sum(1 for char in cleaned if char.isalpha())
    digit_count = sum(1 for char in cleaned if char.isdigit())

    if alpha_count == 0:
        return False

    # Reject token-like garbage such as short binary/hex mixes ("c\x01") and
    # machine-style identifiers dominated by digits.
    if digit_count > alpha_count * 2:
        return False

    return True


def extract_coordinates(block):
    coords = []
    index = 0

    while index <= len(block) - 9:
        if block[index:index + 5] == COORD_MARKER:
            value = struct.unpack("<i", block[index + 5:index + 9])[0]
            coords.append(value)
            index += 9
            continue
        index += 1

    return coords


def emit_debug_sample(payload, name_start, name_end, name, coords, altar_type=None, type_start=None, length_start=None):
    global DEBUG_SAMPLE_COUNT

    if not ARGS.debug_blocks or DEBUG_SAMPLE_COUNT >= DEBUG_SAMPLE_LIMIT:
        return

    start = max(0, name_start - 32)
    end = min(len(payload), name_end + 96)
    raw_block = payload[start:end]
    payload_start = max(0, name_start - 48)
    payload_end = min(len(payload), name_end + 160)
    payload_block = payload[payload_start:payload_end]
    raw_text = raw_block.decode("utf-8", errors="ignore").replace("\x00", " ")
    coord_block = payload[name_end:name_end + 64]
    debug_entry = {
        "name": name,
        "match_start": name_start,
        "match_end": name_end,
        "payload_start": payload_start,
        "payload_end": payload_end,
        "altar_type": altar_type,
        "type_start": type_start,
        "length_start": length_start,
        "name_length": name_end - name_start,
        "coords": [int(value) for value in coords[:6]],
        "coord_block_hex": coord_block.hex(),
        "nearby_hex_tokens": HEX_TOKEN_PATTERN.findall(raw_text),
        "altar_type_hint": "unknown",
        "payload_hex": payload_block.hex(),
        "payload_text": payload_block.decode("utf-8", errors="ignore").replace("\x00", " "),
        "raw_hex": raw_block.hex(),
        "raw_text": raw_text,
    }
    DEBUG_SAMPLE_COUNT += 1
    print(f"ALTAR_DEBUG {json.dumps(debug_entry, ensure_ascii=True)}", flush=True)


def emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, reason, raw_name=b""):
    global DEBUG_SAMPLE_COUNT

    if not ARGS.debug_blocks or DEBUG_SAMPLE_COUNT >= DEBUG_SAMPLE_LIMIT:
        return

    start = max(0, prefix_index - 24)
    end = min(len(payload), prefix_index + 120)
    raw_block = payload[start:end]
    debug_entry = {
        "kind": "candidate",
        "prefix_index": prefix_index,
        "type_start": type_start,
        "altar_type": int(altar_type) if altar_type is not None else None,
        "length_start": length_start,
        "name_length": int(name_length),
        "reason": reason,
        "raw_name": decode_area_name(raw_name) if raw_name else "",
        "raw_hex": raw_block.hex(),
        "raw_text": raw_block.decode("utf-8", errors="ignore").replace("\x00", " "),
    }
    DEBUG_SAMPLE_COUNT += 1
    print(f"ALTAR_DEBUG {json.dumps(debug_entry, ensure_ascii=True)}", flush=True)


def iter_name_fields(payload):
    index = 0
    seen_ranges = set()

    while index < len(payload):
        prefix_index = payload.find(NAME_FIELD_PREFIX, index)
        if prefix_index < 0:
            break

        type_start = prefix_index + len(NAME_FIELD_PREFIX)
        length_start = type_start + 5

        if length_start + 4 > len(payload):
            emit_debug_candidate(payload, prefix_index, type_start, None, length_start, -1, "length_out_of_bounds")
            break

        altar_type = struct.unpack("<I", payload[type_start:type_start + 4])[0]
        name_length = struct.unpack("<I", payload[length_start:length_start + 4])[0]
        if altar_type not in ALLOWED_ALTAR_TYPES:
            emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, "unsupported_type")
            index = prefix_index + 1
            continue

        if not 2 <= name_length <= 96:
            emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, "invalid_name_length")
            index = prefix_index + 1
            continue

        name_start = length_start + 4
        name_end = name_start + name_length
        if name_end > len(payload):
            emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, "name_out_of_bounds")
            index = prefix_index + 1
            continue

        raw_name = payload[name_start:name_end]
        name = decode_area_name(raw_name)
        if not name:
            emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, "empty_name", raw_name)
            index = prefix_index + 1
            continue

        if not is_probable_altar_name(name):
            emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, "rejected_name", raw_name)
            index = prefix_index + 1
            continue

        range_key = (name_start, name_end)
        if range_key in seen_ranges:
            emit_debug_candidate(payload, prefix_index, type_start, altar_type, length_start, name_length, "duplicate_range", raw_name)
            index = prefix_index + 1
            continue

        seen_ranges.add(range_key)
        yield {
            "name": name,
            "name_start": name_start,
            "name_end": name_end,
            "type_start": type_start,
            "length_start": length_start,
            "altar_type": altar_type,
        }

        index = prefix_index + 1


def extract_altars(payload):
    altars = []

    for name_field in iter_name_fields(payload):
        name = name_field["name"]
        coord_block = payload[name_field["name_end"]:name_field["name_end"] + 64]
        coords = extract_coordinates(coord_block)
        if len(coords) < 3:
            continue

        emit_debug_sample(
            payload,
            name_field["name_start"],
            name_field["name_end"],
            name,
            coords,
            altar_type=name_field.get("altar_type"),
            type_start=name_field.get("type_start"),
            length_start=name_field.get("length_start"),
        )

        x = int(coords[0])
        z = int(coords[1])
        y = int(coords[2])

        altar_key = (name, x, y, z)
        if altar_key in SEEN_ALTARS:
            continue

        SEEN_ALTARS.add(altar_key)
        altars.append({
            "id": f"{name}:{x}:{y}:{z}",
            "name": name,
            "altar_type": name_field.get("altar_type"),
            "x": x,
            "y": y,
            "z": z,
            "payload_hex": payload[max(0, name_field["name_start"] - 48):min(len(payload), name_field["name_end"] + 160)].hex(),
            "payload_text": payload[max(0, name_field["name_start"] - 48):min(len(payload), name_field["name_end"] + 160)].decode("utf-8", errors="ignore").replace("\x00", " "),
        })

    return altars


def handle_packet(packet):
    if not packet.haslayer(TCP):
        return

    tcp_layer = packet[TCP]
    channel_port = get_channel_port(tcp_layer)
    if channel_port is None:
        return

    payload = bytes(tcp_layer.payload)
    if len(payload) < PAYLOAD_MIN_LENGTH:
        return

    for altar in extract_altars(payload):
        altar["port"] = channel_port
        altar["channel"] = channel_port

        if ARGS.json:
            print(json.dumps(altar), flush=True)
        else:
            print(f"ALTAR_TYPE {altar.get('altar_type')} | {altar['name']} @ X:{altar['x']} Y:{altar['y']} Z:{altar['z']}")



parser = argparse.ArgumentParser()
parser.add_argument("--json", action="store_true")
parser.add_argument("--debug-blocks", action="store_true")
ARGS = parser.parse_args()

if not ARGS.json:
    print("Listening for altar positions...", flush=True)

sniff(
    filter="tcp and (port 6061 or port 6062 or port 6063 or port 6064)",
    prn=handle_packet,
    store=False,
)
