import type { LosslessUrl, QueryPiece } from "../../core/url";
import styles from "../../styles/workbench.module.css";

interface StructuredViewProps {
  readonly snapshot: LosslessUrl | null;
  readonly busy: boolean;
}

function buildQueryLabels(pieces: readonly QueryPiece[]) {
  const totals = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const piece of pieces) {
    totals.set(piece.rawKey, (totals.get(piece.rawKey) ?? 0) + 1);
  }
  return pieces.map((piece, index) => {
    const occurrenceIndex = (seen.get(piece.rawKey) ?? 0) + 1;
    seen.set(piece.rawKey, occurrenceIndex);
    const duplicateCount = totals.get(piece.rawKey) ?? 1;
    const occurrence =
      duplicateCount > 1
        ? `, occurrence ${occurrenceIndex} of ${duplicateCount}`
        : "";
    return `Query Parameter ${index + 1} of ${pieces.length}${occurrence}`;
  });
}

export function StructuredView({ snapshot, busy }: StructuredViewProps) {
  const managedCount = snapshot
    ? 1 + snapshot.path.length + snapshot.query.length
    : 0;
  const queryLabels = snapshot ? buildQueryLabels(snapshot.query) : [];

  return (
    <section aria-labelledby="structured-heading" className={styles.panel}>
      <h2 id="structured-heading" tabIndex={-1}>
        Structured View
      </h2>
      <p id="piece-summary" aria-live="polite" className={styles.position}>
        {managedCount} Managed {managedCount === 1 ? "Piece" : "Pieces"}
      </p>
      <div aria-busy={busy} aria-describedby="piece-summary">
        {!snapshot ? (
          <p>No session. Enter a supported URL to inspect its pieces.</p>
        ) : (
          <ol id="managed-pieces" className={styles.pieceList}>
            <li className={styles.pieceRow} data-piece-id={snapshot.domainId}>
              <span className={styles.typeLabel}>Domain</span>
              <p className={styles.position}>Domain, 1 of 1</p>
              <label htmlFor={`unicode-${snapshot.domainId}`}>Unicode Domain</label>
              <input
                id={`unicode-${snapshot.domainId}`}
                className={styles.urlValue}
                dir="ltr"
                value={snapshot.domain.unicode}
                readOnly
              />
              <label htmlFor={`ascii-${snapshot.domainId}`}>
                ASCII/Punycode Domain
              </label>
              <input
                id={`ascii-${snapshot.domainId}`}
                className={styles.urlValue}
                dir="ltr"
                value={snapshot.domain.ascii}
                readOnly
              />
              <p className={styles.conversionStatus}>Validated domain forms</p>
            </li>
            {snapshot.path.map((piece, index) => (
              <li className={styles.pieceRow} data-piece-id={piece.id} key={piece.id}>
                <span className={styles.typeLabel}>Path Segment</span>
                <label htmlFor={`path-${piece.id}`}>
                  Path Segment {index + 1} of {snapshot.path.length}
                </label>
                <input
                  id={`path-${piece.id}`}
                  className={styles.urlValue}
                  dir="ltr"
                  value={piece.rawSegment}
                  readOnly
                />
              </li>
            ))}
            {snapshot.query.map((piece, index) => (
              <li className={styles.pieceRow} data-piece-id={piece.id} key={piece.id}>
                <span className={styles.typeLabel}>Query Parameter</span>
                <p className={styles.position}>
                  {queryLabels[index]}
                </p>
                <label htmlFor={`query-key-${piece.id}`}>Key</label>
                <input
                  id={`query-key-${piece.id}`}
                  className={styles.urlValue}
                  dir="ltr"
                  value={piece.rawKey}
                  readOnly
                />
                <label htmlFor={`query-value-${piece.id}`}>
                  {piece.equalsPresent ? "Value" : "Value absent"}
                </label>
                <input
                  id={`query-value-${piece.id}`}
                  className={styles.urlValue}
                  dir="ltr"
                  value={piece.rawValue}
                  readOnly
                />
              </li>
            ))}
          </ol>
        )}
      </div>
      {snapshot?.problems.map((problem) => (
        <p className={styles.validation} key={`${problem.code}-${problem.message}`}>
          {problem.message}
        </p>
      ))}
    </section>
  );
}
