import argparse
import json
import re
import struct
from scapy.all import sniff, TCP

CHANNEL_PORTS = (6061, 6062, 6063, 6064)
PAYLOAD_MIN_LENGTH = 80
COORD_MARKER = b"\x01\x04\x00\x00\x00"
AREA_NAME_PATTERN = re.compile(rb"([ -~]{3,48}?Area)")
SEEN_ALTARS = set()


def get_channel_port(tcp_layer):
    if tcp_layer.sport in CHANNEL_PORTS:
        return int(tcp_layer.sport)
    if tcp_layer.dport in CHANNEL_PORTS:
        return int(tcp_layer.dport)
    return None


def decode_area_name(raw_name):
    name = raw_name.decode("utf-8", errors="ignore").replace("\x00", "").strip()
    return " ".join(name.split())


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


def extract_altars(payload):
    altars = []

    for match in AREA_NAME_PATTERN.finditer(payload):
        name = decode_area_name(match.group(1))
        if not name:
            continue

        coord_block = payload[match.end():match.end() + 64]
        coords = extract_coordinates(coord_block)

        # 🔥 FIX: wir brauchen 3 Werte (X, Z, Y)
        if len(coords) < 3:
            continue

        x = int(coords[0])
        z = int(coords[1])  # Höhe
        y = int(coords[2])

        altar_key = (name, x, y, z)
        if altar_key in SEEN_ALTARS:
            continue

        SEEN_ALTARS.add(altar_key)

        altars.append({
            "id": f"{name}:{x}:{y}:{z}",
            "name": name,
            "x": x,
            "y": y,
            "z": z,
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
            print(f"{altar['name']} @ X:{altar['x']} Y:{altar['y']} Z:{altar['z']}")


parser = argparse.ArgumentParser()
parser.add_argument("--json", action="store_true")
ARGS = parser.parse_args()

if not ARGS.json:
    print("Listening for altar positions...", flush=True)

sniff(
    filter="tcp and (port 6061 or port 6062 or port 6063 or port 6064)",
    prn=handle_packet,
    store=False,
)