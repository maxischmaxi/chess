import dynamic from "next/dynamic";

const Chessboard = dynamic(() =>
    import("@/components/chessboard").then((mod) => mod.Chessboard),
    { ssr: !!false }
);

export default async function Page() {
    return <Chessboard againstAi  />;
}
