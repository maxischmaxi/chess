import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const Chessboard = dynamic(() =>
    import("@/components/chessboard").then((mod) => mod.Chessboard),
    { ssr: !!false }
);

type Props = {
    params: Promise<{ gameId: string }>;
}

export default async function Page({ params }: Props) {
    const { gameId } = await params;
    const fens = await api.getBoard(gameId);

    if(!Array.isArray(fens)) {
        return <div>Game not found</div>;
    }

    return <Chessboard fens={fens} againstAi={false} />;
}
