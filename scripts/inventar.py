import argparse
import json
import struct
from scapy.all import sniff, TCP

def parse_packet(pkt):

    if not pkt.haslayer(TCP):
        return None

    payload = bytes(pkt[TCP].payload)

    # Inventar-Paket erkennen
    if not payload.startswith(b"\x24\x00\x00\x00"):
        return None

    try:

        weight_raw = struct.unpack("<I", payload[27:31])[0]
        max_raw = struct.unpack("<I", payload[36:40])[0]

        weight = weight_raw / 1000
        max_weight = max_raw / 1000

        usage = (weight / max_weight) * 100 if max_weight else 0
        return {
            "weight": weight,
            "max_weight": max_weight,
            "usage": usage,
        }
    except:
        return None


def handle_packet(pkt):
    result = parse_packet(pkt)
    if not result:
        return

    if ARGS.json:
        print(json.dumps(result), flush=True)
        return

    print("------ INVENTORY ------")
    print(f"Weight:     {result['weight']:.2f}")
    print(f"MaxWeight:  {result['max_weight']:.2f}")
    print(f"Usage:      {result['usage']:.2f}%")
    print("-----------------------\n")


parser = argparse.ArgumentParser()
parser.add_argument("--json", action="store_true")
ARGS = parser.parse_args()

if not ARGS.json:
    print("Listening for inventory packets...")

sniff(filter="tcp", prn=handle_packet, store=0)
