import argparse
import json
import struct
from datetime import datetime
from pathlib import Path
from scapy.all import sniff, TCP, IP

SERVER_IP = "5.196.0.1"   # optional anpassen
CHANNEL_PORTS = (6061, 6062, 6063, 6064)
LOG_PATH = Path(__file__).with_name("playerposition.log")

PLAYER_HEADER = bytes.fromhex(
"000000c8000000030800000037e3951101001001"
)

DEBUG_STATE = {
    "packet_count": 0,
    "short_payload_count": 0,
    "header_miss_count": 0,
    "parse_error_count": 0,
    "success_count": 0,
}


def write_log(message):

    timestamp = datetime.now().isoformat(timespec="seconds")
    try:
        with LOG_PATH.open("a", encoding="utf-8") as log_file:
            log_file.write(f"{timestamp} {message}\n")
    except Exception:
        pass

def parse_player_position(payload):

    pos = payload.find(PLAYER_HEADER)

    if pos == -1:
        DEBUG_STATE["header_miss_count"] += 1
        if DEBUG_STATE["header_miss_count"] <= 5 or DEBUG_STATE["header_miss_count"] % 50 == 0:
            write_log(
                f"HEADER_MISS count={DEBUG_STATE['header_miss_count']} payload_len={len(payload)}"
            )
        return

    offset = pos + len(PLAYER_HEADER)

    try:

        x = struct.unpack("<f", payload[offset+5:offset+9])[0]
        z = struct.unpack("<f", payload[offset+14:offset+18])[0]
        y = struct.unpack("<f", payload[offset+23:offset+27])[0]
        return {"x": x, "z": z, "y": y}

    except Exception as error:
        DEBUG_STATE["parse_error_count"] += 1
        write_log(
            f"PARSE_ERROR count={DEBUG_STATE['parse_error_count']} "
            f"offset={offset} payload_len={len(payload)} error={error}"
        )
        return


def handle_packet(packet):

    if not packet.haslayer(TCP):
        return

    tcp_layer = packet[TCP]
    payload = bytes(packet[TCP].payload)
    DEBUG_STATE["packet_count"] += 1

    source_ip = packet[IP].src if packet.haslayer(IP) else "?"
    destination_ip = packet[IP].dst if packet.haslayer(IP) else "?"

    if len(payload) < 50:
        DEBUG_STATE["short_payload_count"] += 1
        if DEBUG_STATE["short_payload_count"] <= 5 or DEBUG_STATE["short_payload_count"] % 50 == 0:
            write_log(
                "SHORT_PAYLOAD "
                f"count={DEBUG_STATE['short_payload_count']} "
                f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
                f"payload_len={len(payload)}"
            )
        return

    result = parse_player_position(payload)
    if not result:
        return

    port = None

    # Prefer the server-side channel port. That makes channel detection stable
    # even when client-side packets use the same local stream in both directions.
    if packet.haslayer(IP):
        ip_layer = packet[IP]
        if ip_layer.src == SERVER_IP and tcp_layer.sport in CHANNEL_PORTS:
            port = tcp_layer.sport
        elif ip_layer.dst == SERVER_IP and tcp_layer.dport in CHANNEL_PORTS:
            port = tcp_layer.dport

    if port is None:
        if tcp_layer.sport in CHANNEL_PORTS:
            port = tcp_layer.sport
        elif tcp_layer.dport in CHANNEL_PORTS:
            port = tcp_layer.dport

    if port is None:
        write_log(
            "CHANNEL_NOT_DETECTED "
            f"src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
            f"payload_len={len(payload)}"
        )
        return

    result["port"] = int(port)
    result["channel"] = int(port)
    DEBUG_STATE["success_count"] += 1
    write_log(
        "PLAYER_POSITION "
        f"count={DEBUG_STATE['success_count']} "
        f"channel={port} src={source_ip}:{tcp_layer.sport} dst={destination_ip}:{tcp_layer.dport} "
        f"x={result['x']:.2f} z={result['z']:.2f} y={result['y']:.2f}"
    )

    if ARGS.json:
        print(json.dumps(result), flush=True)
        return

    print(f"\nPLAYER POSITION")
    print(f"X:{result['x']:.2f}  Z:{result['z']:.2f}  Y:{result['y']:.2f}")


parser = argparse.ArgumentParser()
parser.add_argument("--json", action="store_true")
ARGS = parser.parse_args()

write_log(
    "START "
    f"json={ARGS.json} server_ip={SERVER_IP} ports={','.join(str(port) for port in CHANNEL_PORTS)}"
)

if not ARGS.json:
    print("Listening for player position...\n")
    print(f"Log: {LOG_PATH}\n")

sniff(
    filter="tcp and (port 6061 or port 6062 or port 6063 or port 6064)",
    prn=handle_packet,
    store=False
)
