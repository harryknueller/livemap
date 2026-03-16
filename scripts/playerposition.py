import argparse
import json
import struct
from scapy.all import sniff, TCP, IP

SERVER_IP = "5.196.0.1"   # optional anpassen
CHANNEL_PORTS = (6061, 6062, 6063, 6064)

PLAYER_HEADER = bytes.fromhex(
"000000c8000000030800000037e3951101001001"
)

def parse_player_position(payload):

    pos = payload.find(PLAYER_HEADER)

    if pos == -1:
        return

    offset = pos + len(PLAYER_HEADER)

    try:

        x = struct.unpack("<f", payload[offset+5:offset+9])[0]
        z = struct.unpack("<f", payload[offset+14:offset+18])[0]
        y = struct.unpack("<f", payload[offset+23:offset+27])[0]
        return {"x": x, "z": z, "y": y}

    except:
        return


def handle_packet(packet):

    if not packet.haslayer(TCP):
        return

    tcp_layer = packet[TCP]
    payload = bytes(packet[TCP].payload)

    if len(payload) < 50:
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
        return

    result["port"] = int(port)
    result["channel"] = int(port)

    if ARGS.json:
        print(json.dumps(result), flush=True)
        return

    print(f"\nPLAYER POSITION")
    print(f"X:{result['x']:.2f}  Z:{result['z']:.2f}  Y:{result['y']:.2f}")


parser = argparse.ArgumentParser()
parser.add_argument("--json", action="store_true")
ARGS = parser.parse_args()

if not ARGS.json:
    print("Listening for player position...\n")

sniff(
    filter="tcp and (port 6061 or port 6062 or port 6063 or port 6064)",
    prn=handle_packet,
    store=False
)
