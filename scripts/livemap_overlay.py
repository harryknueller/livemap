import json
import math
import time
import tkinter as tk
from pathlib import Path

from playerposition import PlayerPosition, PlayerPositionTracker


ORE_FILES = {
    "adamantit": "#6c7a89",
    "eisen": "#c06339",
    "gold": "#e2bf4f",
    "kobalt": "#4d79c7",
    "kohle": "#4b4b4b",
    "kupfer": "#b87333",
    "mithril": "#79d4e5",
    "obsidian": "#6d55a3",
    "schwefel": "#d8d04e",
    "silber": "#cfd6db",
}


class LiveMapOverlay:
    def __init__(self, root: tk.Tk, base_dir: Path):
        self.root = root
        self.base_dir = base_dir
        self.width = 950
        self.height = 820
        self.padding = 48
        self.player_position: PlayerPosition | None = None
        self.ore_data = self._load_ore_data()
        self.bounds = self._calculate_bounds()

        self.root.title("Quinfall Livemap")
        self.root.geometry(f"{self.width}x{self.height}+40+40")
        self.root.configure(bg="#101418")
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", 0.92)

        self.canvas = tk.Canvas(
            self.root,
            width=self.width,
            height=self.height,
            bg="#101418",
            highlightthickness=0,
        )
        self.canvas.pack(fill="both", expand=True)

        self.status_var = tk.StringVar(
            value="Spielerposition wird ueber TCP Port 6063 gesucht..."
        )

        self._setup_window_controls()
        self.tracker = PlayerPositionTracker()
        self.tracker.start()

        self.draw()
        self.root.after(500, self._refresh_loop)

    def _load_ore_data(self) -> dict[str, list[tuple[float, float]]]:
        ore_data: dict[str, list[tuple[float, float]]] = {}

        for ore_name in ORE_FILES:
            file_path = self.base_dir / ore_name
            if not file_path.exists():
                continue

            with file_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)

            coords = payload.get("data", {}).get("coordinates", [])
            ore_data[ore_name] = [(float(x), float(y)) for x, y in coords]

        return ore_data

    def _calculate_bounds(self) -> tuple[float, float, float, float]:
        xs = []
        ys = []
        for coords in self.ore_data.values():
            for x, y in coords:
                xs.append(x)
                ys.append(y)

        if not xs or not ys:
            return (-100.0, 100.0, -100.0, 100.0)

        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)
        padding = 1000.0
        return (min_x - padding, max_x + padding, min_y - padding, max_y + padding)

    def _setup_window_controls(self) -> None:
        self.root.bind("<ButtonPress-1>", self._start_move)
        self.root.bind("<B1-Motion>", self._do_move)
        self.root.bind("<Escape>", lambda _event: self.root.destroy())
        self.root.bind("q", lambda _event: self.root.destroy())

    def _start_move(self, event) -> None:
        self.root._drag_start_x = event.x
        self.root._drag_start_y = event.y

    def _do_move(self, event) -> None:
        x = self.root.winfo_x() + event.x - self.root._drag_start_x
        y = self.root.winfo_y() + event.y - self.root._drag_start_y
        self.root.geometry(f"+{x}+{y}")

    def _refresh_loop(self) -> None:
        if self.tracker.latest_position is not None:
            self.player_position = self.tracker.latest_position
            self.status_var.set(
                "Spieler: "
                f"X {self.player_position.x:.2f} | "
                f"Z {self.player_position.z:.2f} | "
                f"Y {self.player_position.y:.2f}"
            )

        self.draw()
        self.root.after(500, self._refresh_loop)

    def _world_to_canvas(self, world_x: float, world_y: float) -> tuple[float, float]:
        min_x, max_x, min_y, max_y = self.bounds
        map_width = self.width - 2 * self.padding
        map_height = self.height - 180

        x_ratio = (world_x - min_x) / max(max_x - min_x, 1.0)
        y_ratio = (world_y - min_y) / max(max_y - min_y, 1.0)

        canvas_x = self.padding + x_ratio * map_width
        canvas_y = self.padding + (1.0 - y_ratio) * map_height
        return canvas_x, canvas_y

    def _draw_background(self) -> None:
        self.canvas.create_rectangle(
            20, 20, self.width - 20, self.height - 20, fill="#131a1f", outline="#31414c"
        )
        self.canvas.create_rectangle(
            self.padding,
            self.padding,
            self.width - self.padding,
            self.height - 132,
            fill="#172229",
            outline="#44606e",
            width=2,
        )

        min_x, max_x, min_y, max_y = self.bounds
        grid_color = "#24343d"

        for step in range(6):
            x = self.padding + step * (self.width - 2 * self.padding) / 5
            y = self.padding + step * (self.height - 180) / 5

            self.canvas.create_line(
                x, self.padding, x, self.height - 132, fill=grid_color, dash=(3, 5)
            )
            self.canvas.create_line(
                self.padding, y, self.width - self.padding, y, fill=grid_color, dash=(3, 5)
            )

            world_x = min_x + step * (max_x - min_x) / 5
            world_y = max_y - step * (max_y - min_y) / 5
            self.canvas.create_text(
                x,
                self.height - 118,
                text=f"{world_x:.0f}",
                fill="#8ea3ae",
                font=("Consolas", 9),
            )
            self.canvas.create_text(
                24,
                y,
                text=f"{world_y:.0f}",
                fill="#8ea3ae",
                font=("Consolas", 9),
                anchor="w",
            )

    def _draw_ores(self) -> None:
        for ore_name, coords in self.ore_data.items():
            color = ORE_FILES[ore_name]
            for world_x, world_y in coords:
                x, y = self._world_to_canvas(world_x, world_y)
                self.canvas.create_oval(
                    x - 2,
                    y - 2,
                    x + 2,
                    y + 2,
                    fill=color,
                    outline="",
                )

    def _draw_player(self) -> None:
        if not self.player_position:
            return

        x, y = self._world_to_canvas(self.player_position.x, self.player_position.z)
        pulse = 4 + abs(math.sin(time.time() * 4)) * 4
        self.canvas.create_oval(
            x - 9,
            y - 9,
            x + 9,
            y + 9,
            fill="",
            outline="#f45151",
            width=2,
        )
        self.canvas.create_oval(
            x - pulse,
            y - pulse,
            x + pulse,
            y + pulse,
            fill="#ff6b6b",
            outline="#fff2f2",
            width=1,
        )
        self.canvas.create_text(
            x + 14,
            y - 12,
            text="Du",
            fill="#fff2f2",
            font=("Segoe UI", 10, "bold"),
            anchor="w",
        )

    def _draw_legend(self) -> None:
        self.canvas.create_text(
            self.padding,
            self.height - 96,
            text="Quinfall Livemap",
            fill="#edf6fa",
            font=("Segoe UI", 16, "bold"),
            anchor="w",
        )
        self.canvas.create_text(
            self.padding,
            self.height - 70,
            text=self.status_var.get(),
            fill="#a9bbc4",
            font=("Consolas", 10),
            anchor="w",
        )
        self.canvas.create_text(
            self.width - self.padding,
            self.height - 96,
            text="ESC/Q schliesst | Linke Maustaste zieht das Fenster",
            fill="#8ea3ae",
            font=("Segoe UI", 10),
            anchor="e",
        )

        start_x = self.padding
        y = self.height - 42
        for index, ore_name in enumerate(self.ore_data):
            x = start_x + index * 90
            color = ORE_FILES[ore_name]
            self.canvas.create_rectangle(x, y - 8, x + 12, y + 4, fill=color, outline="")
            self.canvas.create_text(
                x + 18,
                y - 1,
                text=ore_name,
                fill="#d7e3e8",
                font=("Segoe UI", 9),
                anchor="w",
            )

    def draw(self) -> None:
        self.canvas.delete("all")
        self._draw_background()
        self._draw_ores()
        self._draw_player()
        self._draw_legend()


def main() -> None:
    root = tk.Tk()
    LiveMapOverlay(root, Path(__file__).resolve().parent)
    root.mainloop()


if __name__ == "__main__":
    main()
