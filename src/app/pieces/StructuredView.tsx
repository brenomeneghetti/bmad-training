import type { LosslessUrl, QueryPiece } from "../../core/url";

interface StructuredViewProps {
  readonly snapshot: LosslessUrl | null;
  readonly busy: boolean;
}

function queryLabel(
  piece: QueryPiece,
  index: number,
  total: number,
  pieces: readonly QueryPiece[],
) {
  const duplicateCount = pieces.filter((candidate) => candidate.rawKey === piece.rawKey).length;
  const occurrenceIndex =
    pieces.slice(0, index + 1).filter((candidate) => candidate.rawKey === piece.rawKey)
      .length;
  const occurrence =
    duplicateCount > 1 ? `, occurrence ${occurrenceIndex} of ${duplicateCount}` : "";
  return `Query Parameter ${index + 1} of ${total}${occurrence}`;
}

export function StructuredView({ snapshot, busy }: StructuredViewProps) {
  const managedCount = snapshot
    ? 1 + snapshot.path.length + snapshot.query.length
    : 0;

  return (
    <section aria-labelledby="structured-heading" className="panel">
      <h2 id="structured-heading" tabIndex={-1}>
        Structured View
      </h2>
      <a className="skip-link" href="#managed-pieces">
        Skip to Structured View results
      </a>
      <p id="piece-summary" aria-live="polite">
        {managedCount} Managed {managedCount === 1 ? "Piece" : "Pieces"}
      </p>
      <div aria-busy={busy} aria-describedby="piece-summary">
        {!snapshot ? (
          <p>No session. Enter a supported URL to inspect its pieces.</p>
        ) : (
          <ol id="managed-pieces" className="piece-list">
            <li className="piece-row" data-piece-id={snapshot.domainId}>
              <span className="type-label">Domain</span>
              <p className="position">Domain, 1 of 1</p>
              <label htmlFor={`unicode-${snapshot.domainId}`}>Unicode Domain</label>
              <input
                id={`unicode-${snapshot.domainId}`}
                className="url-value"
                dir="ltr"
                value={snapshot.domain.unicode}
                readOnly
              />
              <label htmlFor={`ascii-${snapshot.domainId}`}>
                ASCII/Punycode Domain
              </label>
              <input
                id={`ascii-${snapshot.domainId}`}
                className="url-value"
                dir="ltr"
                value={snapshot.domain.ascii}
                readOnly
              />
              <p className="conversion-status">Validated domain forms</p>
            </li>
            {snapshot.path.map((piece, index) => (
              <li className="piece-row" data-piece-id={piece.id} key={piece.id}>
                <span className="type-label">Path Segment</span>
                <label htmlFor={`path-${piece.id}`}>
                  Path Segment {index + 1} of {snapshot.path.length}
                </label>
                <input
                  id={`path-${piece.id}`}
                  className="url-value"
                  dir="ltr"
                  value={piece.rawSegment}
                  readOnly
                />
              </li>
            ))}
            {snapshot.query.map((piece, index) => (
              <li className="piece-row" data-piece-id={piece.id} key={piece.id}>
                <span className="type-label">Query Parameter</span>
                <p className="position">
                  {queryLabel(piece, index, snapshot.query.length, snapshot.query)}
                </p>
                <label htmlFor={`query-key-${piece.id}`}>Key</label>
                <input
                  id={`query-key-${piece.id}`}
                  className="url-value"
                  dir="ltr"
                  value={piece.rawKey}
                  readOnly
                />
                <label htmlFor={`query-value-${piece.id}`}>
                  {piece.equalsPresent ? "Value" : "Value absent"}
                </label>
                <input
                  id={`query-value-${piece.id}`}
                  className="url-value"
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
        <p className="validation" key={problem}>
          {problem}
        </p>
      ))}
    </section>
  );
}
