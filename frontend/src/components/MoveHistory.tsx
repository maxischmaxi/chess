interface MoveHistoryProps {
  moves: string[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const pairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i]!,
      black: moves[i + 1],
    });
  }

  return (
    <div style={{ padding: "16px", background: "#16213e", borderRadius: 8, minWidth: 200, maxHeight: 400, overflowY: "auto" }}>
      <h3 style={{ margin: "0 0 12px", color: "#e0e0e0" }}>Moves</h3>
      {pairs.length === 0 ? (
        <div style={{ color: "#888", fontStyle: "italic" }}>No moves yet</div>
      ) : (
        <div style={{ fontFamily: "monospace", fontSize: 14 }}>
          {pairs.map((p) => (
            <div key={p.number} style={{ display: "flex", gap: 8, padding: "2px 0" }}>
              <span style={{ color: "#888", minWidth: 30 }}>{p.number}.</span>
              <span style={{ color: "#e0e0e0", minWidth: 60 }}>{p.white}</span>
              <span style={{ color: "#e0e0e0", minWidth: 60 }}>{p.black ?? ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
