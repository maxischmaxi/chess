"use client";

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

export function CreateGameButton() {
    const [errorMessage, setErrorMessage] = useState("");
    const [open, setOpen] = useState(false);
    const [againstAi, setAgainstAi] = useState(false);
    const [preferredColor, setPreferredColor] = useState<"w" | "b" | "r">("w");
    const router = useRouter();

    async function createGame() {
        const id = localStorage.getItem("id");

        if (!id) {
            setErrorMessage(
                "Sie müssen angemeldet sein, um ein Spiel zu erstellen",
            );
            return;
        }

        const res = await fetch("/api/game", {
            method: "POST",
            body: JSON.stringify({
                player1: id,
                player2: againstAi ? "ai" : "",
                preferredColor,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            setErrorMessage("Spiel konnte nicht erstellt werden");
            return;
        }

        if (res.status !== 200) {
            setErrorMessage("Spiel konnte nicht erstellt werden");
            return;
        }

        const { gameId } = await res.json();
        router.push(`/game/${gameId}`);
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
                        {errorMessage || "Erstellen Sie ein neues Spiel"}
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
                <div className="flex flex-row justify-center items-center gap-4">
                    <Button
                        onClick={() => setAgainstAi(true)}
                        variant={againstAi ? "default" : "outline"}
                    >
                        AI
                    </Button>
                    <Button
                        onClick={() => setAgainstAi(false)}
                        variant={againstAi ? "outline" : "default"}
                    >
                        Spieler
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={createGame}>Erstellen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
