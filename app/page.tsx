import dynamic from "next/dynamic";

const Chess = dynamic(() =>
    import("@/components/chess").then((mod) => mod.Chess),
);

export default async function Page() {
    return <Chess />;
}
