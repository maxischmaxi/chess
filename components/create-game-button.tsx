"use client";

import { v4 } from "uuid";
import { useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import Image from "next/image";
import { LocalGame } from "@/lib/definitions";

export function CreateGameButton() {
    const [open, setOpen] = useState(false);
    const [preferredColor, setPreferredColor] = useState<"w" | "b" | "r">("w");
    const router = useRouter();

    async function createGame() {
        const id = v4();
        const localGames = JSON.parse(localStorage.getItem("games") || "[]");
        let color: "w" | "b";
        if (preferredColor === "r") {
            color = Math.random() > 0.5 ? "w" : "b";
        } else {
            color = preferredColor;
        }

        const game: LocalGame = {
            id,
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            player1: localStorage.getItem("id") ?? "",
            player2: "ai",
            color,
            moves: [],
        };
        localGames.push(game);
        localStorage.setItem("games", JSON.stringify(localGames));
        router.push(`/game/bot/${id}`);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Neues Spiel erstellen</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Neues Spiel erstellen</DialogTitle>
                    <DialogDescription>
                        {"Erstellen Sie ein neues Spiel"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-row justify-center items-center gap-4">
                    <Button
                        variant={preferredColor !== "w" ? "outline" : "default"}
                        className="py-4 flex-col h-auto gap-0"
                        onClick={() => setPreferredColor("w")}
                    >
                        <span>Weiß</span>
                        <Image
                            src="/pieces/king-w.svg"
                            width={50}
                            height={50}
                            alt="White King"
                        />
                    </Button>
                    <Button
                        variant={preferredColor !== "r" ? "outline" : "default"}
                        className="py-4 flex-col h-auto gap-0"
                        onClick={() => setPreferredColor("r")}
                    >
                        <span>Zufall</span>
                        <Image
                            src="/pieces/king-w.svg"
                            width={50}
                            height={50}
                            alt="Random King"
                        />
                    </Button>
                    <Button
                        variant={preferredColor !== "b" ? "outline" : "default"}
                        className="py-4 flex-col h-auto gap-0"
                        onClick={() => setPreferredColor("b")}
                    >
                        <span>Schwarz</span>
                        <Image
                            src="/pieces/king-b.svg"
                            width={50}
                            height={50}
                            alt="Black King"
                        />
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={createGame}>Erstellen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
