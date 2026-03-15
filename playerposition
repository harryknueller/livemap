import struct
from scapy.all import sniff

PORT = 6063

CHEST_TEMPLATE = 0x00053E68

def parse_packet(pkt):

    if not pkt.haslayer("TCP"):
        return

    payload = bytes(pkt["TCP"].payload)

    marker = b"\x02\x04\x00\x00\x00"
    pos = 0

    while True:

        pos = payload.find(marker, pos)

        if pos == -1:
            break

        try:
            header = payload[pos-20:pos]

            # TemplateID aus Header lesen
            template_id = struct.unpack("<I", header[-4:])[0]

            if template_id != CHEST_TEMPLATE:
                pos += 1
                continue

            x = struct.unpack("<f", payload[pos+5:pos+9])[0]
            z = struct.unpack("<f", payload[pos+14:pos+18])[0]
            y = struct.unpack("<f", payload[pos+23:pos+27])[0]

            print(f"Spielerposition = X:{x:.2f} Z:{z:.2f} Y:{y:.2f}")

        except:
            pass

        pos += 1


print("Scanning for Treasure Chests...")

sniff(filter="tcp port 6063", prn=parse_packet, store=0)