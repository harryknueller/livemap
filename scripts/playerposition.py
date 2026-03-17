import argparse
import json
import os
import struct
from datetime import datetime
from pathlib import Path
from time import monotonic
from scapy.all import sniff, TCP, IP

CHANNEL_PORTS = (6061, 6062, 6063, 6064)
PLAYER_PAYLOAD_LENGTH = 274
LOG_PATH = Path(__file__).with_name("playerposition.log")
LOCK_STATE_PATH = Path(os.environ.get("PLAYERPOSITION_LOCK_PATH", str(Path(__file__).with_name("playerposition-lock.json"))))
BUFFER_LIMIT = 65536
PAIR_WINDOW_SECONDS = 0.35
PAIR_X_MIN = 10.0
PAIR_X_MAX = 80.0
PAIR_Y_MAX = 12.0
PAIR_Z_MAX = 5.0
STABLE_DISTANCE = 6.0
VERTICAL_PAIR_X_MAX = 4.0
VERTICAL_PAIR_Z_MAX = 4.0
VERTICAL_PAIR_Y_MIN = 25.0
VERTICAL_PAIR_Y_MAX = 70.0
EMIT_EPSILON = 1.2
LAYER_SWITCH_XZ_MAX = 4.0
LAYER_SWITCH_Y_MIN = 18.0
TRACK_MAX_STEP = 8.0
TRACK_SWITCH_CONFIRMATIONS = 3
TRACK_SWITCH_WINDOW_SECONDS = 0.8
SELF_LOCK_RADIUS = 14.0
SELF_LOCK_SWITCH_CONFIRMATIONS = 6
SELF_LOCK_TIMEOUT_SECONDS = 2.5
HARD_LOCK_RADIUS = 22.0

PLAYER_HEADER_PREFIX = bytes.fromhex("000000c80000000308000000")
PLAYER_HEADER_SUFFIX = bytes.fromhex("01001001")
FIELD_MARKER = bytes.fromhex("0204000000")

DEBUG_STATE = {
    "packet_count": 0,
    "short_payload_count": 0,
    "header_miss_count": 0,
    "parse_error_count": 0,
    "success_count": 0,
    "server_dump_count": 0,
}
STREAM_BUFFERS = {}
PENDING_TRIPLET = None
PENDING_TRIPLET_AT = 0.0
LAST_EMITTED_POSITION = None
LAST_EMITTED_SIGNATURE = None
PENDING_SWITCH_POSITION = None
PENDING_SWITCH_COUNT = 0
PENDING_SWITCH_AT = 0.0
SELF_LOCK_POSITION = None
SELF_LOCK_LAST_SEEN_AT = 0.0
PENDING_SELF_LOCK_POSITION = None
PENDING_SELF_LOCK_COUNT = 0
PENDING_SELF_LOCK_AT = 0.0
HARD_LOCK_POSITION = None
HARD_LOCK_SIGNATURE = None
LOCK_STATE_MTIME = None


def write_log(message):

    timestamp = datetime.now().isoformat(timespec="seconds")
    try:
        with LOG_PATH.open("a", encoding="utf-8") as log_file:
            log_file.write(f"{timestamp} {message}\n")
    except Exception:
        pass


def maybe_log_server_dump(source_ip, destination_ip, tcp_layer, payload, stream_buffer):

    if DEBUG_STATE["server_dump_count"] >= 8:
        return

    if tcp_layer.sport not in CHANNEL_PORTS:
        return

    if len(payload) < 40 and len(stream_buffer) < 80:
        return

    DEBUG_STATE["server_dump_count"] += 1
    payload_prefix = payload[:96].hex()
    buffer_prefix = stream_buffer[:160].hex()
    write_log(
        "SERVER_DUMP "
        f"count={DEBUG_STATE['server_dump_count']} "
        f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
        f"payload_len={len(payload)} buffer_len={len(stream_buffer)} "
        f"payload_hex={payload_prefix} buffer_hex={buffer_prefix}"
    )

def get_channel_port(tcp_layer):

    if tcp_layer.sport in CHANNEL_PORTS:
        return int(tcp_layer.sport)
    if tcp_layer.dport in CHANNEL_PORTS:
        return int(tcp_layer.dport)
    return None


def is_plausible_coordinate(value):

    if not isinstance(value, float):
        return False
    if value != value:
        return False
    return -50000.0 <= value <= 50000.0


def position_distance(a, b):

    return (
        ((a["x"] - b["x"]) ** 2) +
        ((a["z"] - b["z"]) ** 2) +
        ((a["y"] - b["y"]) ** 2)
    ) ** 0.5


def maybe_handle_manual_lock_requests():

    return


def is_dummy_position(position):

    return abs(position["z"]) < 0.01 and abs(position["y"]) < 0.01


def forms_paired_extents(a, b):

    dx = abs(a["x"] - b["x"])
    dy = abs(a["y"] - b["y"])
    dz = abs(a["z"] - b["z"])
    return PAIR_X_MIN <= dx <= PAIR_X_MAX and dy <= PAIR_Y_MAX and dz <= PAIR_Z_MAX


def forms_vertical_pair(a, b):

    dx = abs(a["x"] - b["x"])
    dy = abs(a["y"] - b["y"])
    dz = abs(a["z"] - b["z"])
    return dx <= VERTICAL_PAIR_X_MAX and dz <= VERTICAL_PAIR_Z_MAX and VERTICAL_PAIR_Y_MIN <= dy <= VERTICAL_PAIR_Y_MAX


def midpoint_position(a, b):

    return {
        "x": (a["x"] + b["x"]) / 2.0,
        "z": (a["z"] + b["z"]) / 2.0,
        "y": (a["y"] + b["y"]) / 2.0,
        "parser": "marker_triplet_midpoint",
        "signature": a.get("signature") or b.get("signature"),
    }


def is_layer_switch_against_last(position):

    global LAST_EMITTED_POSITION

    if LAST_EMITTED_POSITION is None:
        return False

    dx = abs(position["x"] - LAST_EMITTED_POSITION["x"])
    dz = abs(position["z"] - LAST_EMITTED_POSITION["z"])
    dy = abs(position["y"] - LAST_EMITTED_POSITION["y"])
    return dx <= LAYER_SWITCH_XZ_MAX and dz <= LAYER_SWITCH_XZ_MAX and dy >= LAYER_SWITCH_Y_MIN


def should_emit_position(position):

    global LAST_EMITTED_POSITION

    if LAST_EMITTED_POSITION is None:
        return True

    return position_distance(position, LAST_EMITTED_POSITION) >= EMIT_EPSILON


def build_triplet_signature(buffer, marker_pos, consumed):

    header_start = max(0, marker_pos - 20)
    header_bytes = buffer[header_start:marker_pos]
    if not header_bytes:
        header_bytes = buffer[max(0, marker_pos - 8):marker_pos]
    return header_bytes.hex()


def find_variable_player_header(buffer, start_index=0):

    prefix_length = len(PLAYER_HEADER_PREFIX)
    suffix_length = len(PLAYER_HEADER_SUFFIX)
    search_index = start_index

    while True:
        prefix_pos = buffer.find(PLAYER_HEADER_PREFIX, search_index)
        if prefix_pos == -1:
            return -1

        variable_start = prefix_pos + prefix_length
        suffix_pos = variable_start + 4
        if len(buffer) < suffix_pos + suffix_length:
            return -2

        if buffer[suffix_pos:suffix_pos + suffix_length] == PLAYER_HEADER_SUFFIX:
            return prefix_pos

        search_index = prefix_pos + 1


def hard_lock_distance(position):

    if HARD_LOCK_POSITION is None:
        return None

    return position_distance(position, HARD_LOCK_POSITION)


def maybe_migrate_hard_lock_signature(position):

    global HARD_LOCK_SIGNATURE

    if HARD_LOCK_POSITION is None:
        return False

    distance = hard_lock_distance(position)
    if distance is None or distance > HARD_LOCK_RADIUS:
        return False

    next_signature = position.get("signature")
    if not next_signature:
        return False

    previous_signature = HARD_LOCK_SIGNATURE
    HARD_LOCK_SIGNATURE = next_signature
    write_log(
        "HARD_LOCK_SIGNATURE_MIGRATED "
        f"distance={distance:.2f} old={previous_signature} new={next_signature} "
        f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
    )
    return True


def passes_hard_lock(position):

    if HARD_LOCK_POSITION is None:
        return True

    if HARD_LOCK_SIGNATURE:
        if position.get("signature") == HARD_LOCK_SIGNATURE:
            return True
        return maybe_migrate_hard_lock_signature(position)

    return position_distance(position, HARD_LOCK_POSITION) <= HARD_LOCK_RADIUS


def refresh_hard_lock_position(position):

    global HARD_LOCK_POSITION
    global HARD_LOCK_SIGNATURE

    if HARD_LOCK_POSITION is None:
        return

    if not HARD_LOCK_SIGNATURE or position.get("signature") == HARD_LOCK_SIGNATURE:
        HARD_LOCK_POSITION = {
            "x": position["x"],
            "z": position["z"],
            "y": position["y"],
        }
        if position.get("signature"):
            HARD_LOCK_SIGNATURE = position.get("signature")


def accept_hard_locked_position(position):

    global LAST_EMITTED_POSITION
    global LAST_EMITTED_SIGNATURE
    global PENDING_SWITCH_POSITION
    global PENDING_SWITCH_COUNT
    global PENDING_SWITCH_AT
    global PENDING_TRIPLET
    global PENDING_TRIPLET_AT

    LAST_EMITTED_POSITION = position
    LAST_EMITTED_SIGNATURE = position.get("signature")
    refresh_hard_lock_position(position)
    PENDING_SWITCH_POSITION = None
    PENDING_SWITCH_COUNT = 0
    PENDING_SWITCH_AT = 0.0
    PENDING_TRIPLET = None
    PENDING_TRIPLET_AT = 0.0
    return position


def accept_with_self_lock(position):

    global SELF_LOCK_POSITION
    global SELF_LOCK_LAST_SEEN_AT
    global PENDING_SELF_LOCK_POSITION
    global PENDING_SELF_LOCK_COUNT
    global PENDING_SELF_LOCK_AT

    if not passes_hard_lock(position):
        write_log(
            "REJECT_HARD_LOCK "
            f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
        )
        return None

    now = monotonic()

    if SELF_LOCK_POSITION is None:
        SELF_LOCK_POSITION = position.copy()
        SELF_LOCK_LAST_SEEN_AT = now
        PENDING_SELF_LOCK_POSITION = None
        PENDING_SELF_LOCK_COUNT = 0
        PENDING_SELF_LOCK_AT = 0.0
        write_log(
            "SELF_LOCK_INIT "
            f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
        )
        return position

    distance_to_lock = position_distance(position, SELF_LOCK_POSITION)
    if distance_to_lock <= SELF_LOCK_RADIUS:
        SELF_LOCK_POSITION = position.copy()
        SELF_LOCK_LAST_SEEN_AT = now
        PENDING_SELF_LOCK_POSITION = None
        PENDING_SELF_LOCK_COUNT = 0
        PENDING_SELF_LOCK_AT = 0.0
        return position

    if (now - SELF_LOCK_LAST_SEEN_AT) > SELF_LOCK_TIMEOUT_SECONDS:
        write_log(
            "SELF_LOCK_TIMEOUT "
            f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
        )
        SELF_LOCK_POSITION = position.copy()
        SELF_LOCK_LAST_SEEN_AT = now
        PENDING_SELF_LOCK_POSITION = None
        PENDING_SELF_LOCK_COUNT = 0
        PENDING_SELF_LOCK_AT = 0.0
        return position

    if PENDING_SELF_LOCK_POSITION and (now - PENDING_SELF_LOCK_AT) <= TRACK_SWITCH_WINDOW_SECONDS:
        if position_distance(position, PENDING_SELF_LOCK_POSITION) <= TRACK_MAX_STEP:
            PENDING_SELF_LOCK_COUNT += 1
            PENDING_SELF_LOCK_POSITION = position.copy()
            PENDING_SELF_LOCK_AT = now
            if PENDING_SELF_LOCK_COUNT >= SELF_LOCK_SWITCH_CONFIRMATIONS:
                write_log(
                    "SELF_LOCK_SWITCH "
                    f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
                )
                SELF_LOCK_POSITION = position.copy()
                SELF_LOCK_LAST_SEEN_AT = now
                PENDING_SELF_LOCK_POSITION = None
                PENDING_SELF_LOCK_COUNT = 0
                PENDING_SELF_LOCK_AT = 0.0
                return position

            write_log(
                "SELF_LOCK_HOLD "
                f"count={PENDING_SELF_LOCK_COUNT} x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
            )
            return None

    PENDING_SELF_LOCK_POSITION = position.copy()
    PENDING_SELF_LOCK_COUNT = 1
    PENDING_SELF_LOCK_AT = now
    write_log(
        "SELF_LOCK_REJECT "
        f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
    )
    return None


def accept_with_track_lock(position):

    global LAST_EMITTED_POSITION
    global LAST_EMITTED_SIGNATURE
    global PENDING_SWITCH_POSITION
    global PENDING_SWITCH_COUNT
    global PENDING_SWITCH_AT

    if HARD_LOCK_SIGNATURE and position.get("signature") == HARD_LOCK_SIGNATURE:
        write_log(
            "ACCEPT_HARD_LOCKED "
            f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
        )
        return accept_hard_locked_position(position)

    now = monotonic()

    if LAST_EMITTED_POSITION is None:
        accepted = accept_with_self_lock(position)
        if not accepted:
            return None
        LAST_EMITTED_POSITION = accepted
        LAST_EMITTED_SIGNATURE = accepted.get("signature")
        refresh_hard_lock_position(accepted)
        PENDING_SWITCH_POSITION = None
        PENDING_SWITCH_COUNT = 0
        PENDING_SWITCH_AT = 0.0
        return accepted

    distance_to_last = position_distance(position, LAST_EMITTED_POSITION)
    if distance_to_last <= TRACK_MAX_STEP:
        accepted = accept_with_self_lock(position)
        if not accepted:
            return None
        LAST_EMITTED_POSITION = accepted
        LAST_EMITTED_SIGNATURE = accepted.get("signature")
        refresh_hard_lock_position(accepted)
        PENDING_SWITCH_POSITION = None
        PENDING_SWITCH_COUNT = 0
        PENDING_SWITCH_AT = 0.0
        return accepted

    if PENDING_SWITCH_POSITION and (now - PENDING_SWITCH_AT) <= TRACK_SWITCH_WINDOW_SECONDS:
        if position_distance(position, PENDING_SWITCH_POSITION) <= TRACK_MAX_STEP:
            PENDING_SWITCH_COUNT += 1
            PENDING_SWITCH_POSITION = position
            PENDING_SWITCH_AT = now
            if PENDING_SWITCH_COUNT >= TRACK_SWITCH_CONFIRMATIONS:
                accepted = accept_with_self_lock(position)
                if not accepted:
                    return None
                LAST_EMITTED_POSITION = accepted
                LAST_EMITTED_SIGNATURE = accepted.get("signature")
                refresh_hard_lock_position(accepted)
                write_log(
                    "ACCEPT_SWITCH "
                    f"x={accepted['x']:.2f} z={accepted['z']:.2f} y={accepted['y']:.2f}"
                )
                PENDING_SWITCH_POSITION = None
                PENDING_SWITCH_COUNT = 0
                PENDING_SWITCH_AT = 0.0
                return accepted
            write_log(
                "HOLD_SWITCH "
                f"count={PENDING_SWITCH_COUNT} x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
            )
            return None

    PENDING_SWITCH_POSITION = position
    PENDING_SWITCH_COUNT = 1
    PENDING_SWITCH_AT = now
    write_log(
        "START_SWITCH_CANDIDATE "
        f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
    )
    return None


def filter_detected_position(position):
    if is_dummy_position(position):
        write_log(
            "REJECT_DUMMY "
            f"x={position['x']:.2f} z={position['z']:.2f} y={position['y']:.2f}"
        )
        return None

    return position


def try_unpack_position_triplet(buffer, marker_pos):

    required_bytes = len(FIELD_MARKER) * 3 + 12
    if len(buffer) < marker_pos + required_bytes:
        return None, buffer[marker_pos:]

    second_marker_pos = marker_pos + 9
    third_marker_pos = marker_pos + 18

    if buffer[second_marker_pos:second_marker_pos + len(FIELD_MARKER)] != FIELD_MARKER:
        return None, None
    if buffer[third_marker_pos:third_marker_pos + len(FIELD_MARKER)] != FIELD_MARKER:
        return None, None

    try:
        x = struct.unpack("<f", buffer[marker_pos + 5:marker_pos + 9])[0]
        z = struct.unpack("<f", buffer[marker_pos + 14:marker_pos + 18])[0]
        y = struct.unpack("<f", buffer[marker_pos + 23:marker_pos + 27])[0]
    except Exception as error:
        DEBUG_STATE["parse_error_count"] += 1
        write_log(
            f"TRIPLET_PARSE_ERROR count={DEBUG_STATE['parse_error_count']} "
            f"marker_pos={marker_pos} buffer_len={len(buffer)} error={error}"
        )
        return None, None

    if not all(is_plausible_coordinate(value) for value in (x, z, y)):
        return None, None

    consumed = marker_pos + required_bytes
    return {
        "x": x,
        "z": z,
        "y": y,
        "parser": "marker_triplet",
        "signature": build_triplet_signature(buffer, marker_pos, consumed),
    }, buffer[consumed:]


def parse_locked_positions_from_buffer(buffer):

    positions = []
    min_keep = max(64, len(FIELD_MARKER) * 3 + 12)

    try:
        locked_signature = bytes.fromhex(HARD_LOCK_SIGNATURE)
    except Exception:
        return positions, buffer[-min_keep:]

    if not locked_signature:
        return positions, buffer[-min_keep:]

    scan_index = 0
    while True:

        header_pos = buffer.find(locked_signature, scan_index)
        if header_pos == -1:
            break

        marker_pos = header_pos + len(locked_signature)
        if buffer[marker_pos:marker_pos + len(FIELD_MARKER)] != FIELD_MARKER:
            scan_index = header_pos + 1
            continue

        result, remainder = try_unpack_position_triplet(buffer, marker_pos)
        if result:
            positions.append(result)
            return positions, remainder
        if remainder is not None:
            return positions, buffer[max(0, header_pos):]

        scan_index = marker_pos + 1

    DEBUG_STATE["header_miss_count"] += 1
    if DEBUG_STATE["header_miss_count"] <= 5 or DEBUG_STATE["header_miss_count"] % 50 == 0:
        write_log(
            "LOCKED_HEADER_MISS "
            f"count={DEBUG_STATE['header_miss_count']} buffer_len={len(buffer)}"
        )

    keep_from = max(0, len(buffer) - max(min_keep, len(locked_signature)))
    return positions, buffer[keep_from:]


def parse_positions_from_buffer_generic(buffer):

    positions = []
    scan_index = 0
    last_consumed = 0
    header_length = len(PLAYER_HEADER_PREFIX) + 4 + len(PLAYER_HEADER_SUFFIX)
    required_bytes = header_length + 27
    min_keep = max(header_length, len(FIELD_MARKER) * 3 + 12)

    while True:

        pos = find_variable_player_header(buffer, scan_index)

        if pos == -1:
            break
        if pos == -2:
            return positions, buffer[max(0, len(buffer) - min_keep):]

        offset = pos + header_length
        if len(buffer) < pos + required_bytes:
            return positions, buffer[pos:]

        try:
            if buffer[offset:offset + len(FIELD_MARKER)] != FIELD_MARKER:
                scan_index = pos + 1
                continue
            if buffer[offset + 9:offset + 9 + len(FIELD_MARKER)] != FIELD_MARKER:
                scan_index = pos + 1
                continue
            if buffer[offset + 18:offset + 18 + len(FIELD_MARKER)] != FIELD_MARKER:
                scan_index = pos + 1
                continue

            x = struct.unpack("<f", buffer[offset + 5:offset + 9])[0]
            z = struct.unpack("<f", buffer[offset + 14:offset + 18])[0]
            y = struct.unpack("<f", buffer[offset + 23:offset + 27])[0]
            if all(is_plausible_coordinate(value) for value in (x, z, y)):
                positions.append({
                    "x": x,
                    "z": z,
                    "y": y,
                    "parser": "variable_header_triplet",
                    "signature": buffer[pos:pos + required_bytes].hex(),
                })
            last_consumed = pos + required_bytes
            scan_index = last_consumed
        except Exception as error:
            DEBUG_STATE["parse_error_count"] += 1
            write_log(
                f"PARSE_ERROR count={DEBUG_STATE['parse_error_count']} "
                f"offset={offset} buffer_len={len(buffer)} error={error}"
            )
            scan_index = pos + 1

    if positions:
        return positions, buffer[last_consumed:]

    triplet_scan = 0
    while True:

        marker_pos = buffer.find(FIELD_MARKER, triplet_scan)
        if marker_pos == -1:
            break

        result, remainder = try_unpack_position_triplet(buffer, marker_pos)
        if result:
            positions.append(result)
            return positions, remainder
        if remainder is not None:
            return positions, remainder

        triplet_scan = marker_pos + 1

    DEBUG_STATE["header_miss_count"] += 1
    if DEBUG_STATE["header_miss_count"] <= 5 or DEBUG_STATE["header_miss_count"] % 50 == 0:
        write_log(
            f"HEADER_MISS count={DEBUG_STATE['header_miss_count']} buffer_len={len(buffer)}"
        )

    return positions, buffer[-min_keep:]


def parse_positions_from_buffer(buffer):
    return parse_positions_from_buffer_generic(buffer)


def handle_packet(packet):

    if not packet.haslayer(TCP):
        return

    tcp_layer = packet[TCP]
    channel_port = get_channel_port(tcp_layer)
    if channel_port is None:
        return

    payload = bytes(packet[TCP].payload)
    DEBUG_STATE["packet_count"] += 1
    maybe_handle_manual_lock_requests()

    source_ip = packet[IP].src if packet.haslayer(IP) else "?"
    destination_ip = packet[IP].dst if packet.haslayer(IP) else "?"

    if len(payload) == 0:
        DEBUG_STATE["short_payload_count"] += 1
        if DEBUG_STATE["short_payload_count"] <= 5 or DEBUG_STATE["short_payload_count"] % 50 == 0:
            write_log(
                "EMPTY_PAYLOAD "
                f"count={DEBUG_STATE['short_payload_count']} "
                f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
                f"payload_len={len(payload)}"
            )
        return

    if len(payload) != PLAYER_PAYLOAD_LENGTH:
        DEBUG_STATE["short_payload_count"] += 1
        if DEBUG_STATE["short_payload_count"] <= 5 or DEBUG_STATE["short_payload_count"] % 50 == 0:
            write_log(
                "SKIP_PAYLOAD_LENGTH "
                f"count={DEBUG_STATE['short_payload_count']} "
                f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
                f"payload_len={len(payload)} expected={PLAYER_PAYLOAD_LENGTH}"
            )
        return

    if len(payload) < 50:
        DEBUG_STATE["short_payload_count"] += 1
        if DEBUG_STATE["short_payload_count"] <= 5 or DEBUG_STATE["short_payload_count"] % 50 == 0:
            write_log(
                "SHORT_PAYLOAD "
                f"count={DEBUG_STATE['short_payload_count']} "
                f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
                f"payload_len={len(payload)}"
            )

    stream_key = (int(tcp_layer.sport), int(tcp_layer.dport), channel_port)
    stream_buffer = STREAM_BUFFERS.get(stream_key, b"") + payload
    if len(stream_buffer) > BUFFER_LIMIT:
        stream_buffer = stream_buffer[-BUFFER_LIMIT:]

    maybe_log_server_dump(source_ip, destination_ip, tcp_layer, payload, stream_buffer)

    positions, remaining_buffer = parse_positions_from_buffer(stream_buffer)
    if remaining_buffer:
        STREAM_BUFFERS[stream_key] = remaining_buffer
    else:
        STREAM_BUFFERS.pop(stream_key, None)

    if not positions:
        return

    for result in positions:
        filtered_result = filter_detected_position(result)
        if not filtered_result:
            continue

        result = filtered_result
        result["port"] = channel_port
        result["channel"] = channel_port
        DEBUG_STATE["success_count"] += 1
        write_log(
            "PLAYER_POSITION "
            f"count={DEBUG_STATE['success_count']} "
            f"channel={channel_port} parser={result.get('parser', 'unknown')} "
            f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
            f"x={result['x']:.2f} z={result['z']:.2f} y={result['y']:.2f}"
        )

        if ARGS.json:
            print(json.dumps(result), flush=True)
            continue

        print(f"\nPLAYER POSITION")
        print(f"X:{result['x']:.2f}  Z:{result['z']:.2f}  Y:{result['y']:.2f}")


parser = argparse.ArgumentParser()
parser.add_argument("--json", action="store_true")
ARGS = parser.parse_args()

write_log(
    "START "
    f"json={ARGS.json} ports={','.join(str(port) for port in CHANNEL_PORTS)} "
    f"payload_len={PLAYER_PAYLOAD_LENGTH} hard_lock=disabled"
)

if not ARGS.json:
    print("Listening for player position...\n")
    print(f"Log: {LOG_PATH}\n")

sniff(
    filter="tcp and (port 6061 or port 6062 or port 6063 or port 6064)",
    prn=handle_packet,
    store=False
)
