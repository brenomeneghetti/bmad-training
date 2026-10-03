import type { LosslessUrl } from "../../core/url";
import type { RefObject } from "react";
import type { ManagedPiece } from "./search";
import styles from "../../styles/workbench.module.css";

interface StructuredViewProps {
  readonly snapshot: LosslessUrl | null;
  readonly busy: boolean;
  readonly pieces: readonly ManagedPiece[];
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly onClearSearch: () => void;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
}

export function StructuredView({
  snapshot,
  busy,
  pieces,
  searchTerm,
  onSearchChange,
  onClearSearch,
  searchInputRef,
}: StructuredViewProps) {
  const managedCount = snapshot ? 1 + snapshot.path.length + snapshot.query.length : 0;
  const visibleCount = pieces.length;
  const activeSearch = searchTerm !== "";
  const summary = `${visibleCount} of ${managedCount} Managed Pieces shown`;

  return (
    <section aria-labelledby="structured-heading" className={styles.panel}>
      <h2 id="structured-heading" tabIndex={-1}>
        Structured View
      </h2>
      <div className={styles.searchControls}>
        <label htmlFor="managed-piece-search">Search Managed Pieces</label>
        <input
          id="managed-piece-search"
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.preventDefault();
          }}
          disabled={!snapshot}
          autoComplete="off"
        />
        <button type="button" onClick={onClearSearch} disabled={!activeSearch}>
          Clear Search
        </button>
      </div>
      <p id="piece-summary" className={styles.position}>
        {summary}
      </p>
      <div aria-busy={busy} aria-describedby="piece-summary">
        {!snapshot ? (
          <p>No session. Enter a supported URL to inspect its pieces.</p>
        ) : (
          <>
            {visibleCount === 0 ? (
              <div className={styles.noResults}>
                <p>
                  {summary}. No Managed Piece matches <bdi>‘{searchTerm}’</bdi>.
                </p>
                <button type="button" onClick={onClearSearch}>
                  Clear Search
                </button>
              </div>
            ) : null}
            <ol id="managed-pieces" className={styles.pieceList}>
              {pieces.map((managedPiece, index) => {
              const filteredPosition = `Filtered position ${index + 1} of ${visibleCount}`;
              if (managedPiece.kind === "domain") {
                return (
                  <li
                    className={styles.pieceRow}
                    data-piece-id={managedPiece.id}
                    key={managedPiece.id}
                    aria-posinset={index + 1}
                    aria-setsize={visibleCount}
                  >
                    <span className={styles.typeLabel}>Domain</span>
                    <p className={styles.position}>Domain, 1 of 1</p>
                    <p className={styles.position}>{filteredPosition}</p>
                    <label htmlFor={`unicode-${managedPiece.id}`}>Unicode Domain</label>
                    <input
                      id={`unicode-${managedPiece.id}`}
                      className={styles.urlValue}
                      dir="ltr"
                      value={managedPiece.unicode}
                      readOnly
                    />
                    <label htmlFor={`ascii-${managedPiece.id}`}>
                      ASCII/Punycode Domain
                    </label>
                    <input
                      id={`ascii-${managedPiece.id}`}
                      className={styles.urlValue}
                      dir="ltr"
                      value={managedPiece.ascii}
                      readOnly
                    />
                    <p className={styles.conversionStatus}>Validated domain forms</p>
                  </li>
                );
              }
              if (managedPiece.kind === "path") {
                return (
                  <li
                    className={styles.pieceRow}
                    data-piece-id={managedPiece.id}
                    key={managedPiece.id}
                    aria-posinset={index + 1}
                    aria-setsize={visibleCount}
                  >
                    <span className={styles.typeLabel}>Path Segment</span>
                    <p className={styles.position}>{filteredPosition}</p>
                    <label htmlFor={`path-${managedPiece.id}`}>
                      Path Segment {managedPiece.sourcePosition} of{" "}
                      {managedPiece.sourceTotal}
                    </label>
                    <input
                      id={`path-${managedPiece.id}`}
                      className={styles.urlValue}
                      dir="ltr"
                      value={managedPiece.piece.rawSegment}
                      readOnly
                    />
                  </li>
                );
              }
              const occurrence =
                managedPiece.duplicateTotal > 1
                  ? `, occurrence ${managedPiece.duplicatePosition} of ${managedPiece.duplicateTotal}`
                  : "";
              return (
                <li
                  className={styles.pieceRow}
                  data-piece-id={managedPiece.id}
                  key={managedPiece.id}
                  aria-posinset={index + 1}
                  aria-setsize={visibleCount}
                >
                  <span className={styles.typeLabel}>Query Parameter</span>
                  <p className={styles.position}>
                    Query Parameter {managedPiece.sourcePosition} of{" "}
                    {managedPiece.sourceTotal}
                    {occurrence}
                  </p>
                  <p className={styles.position}>{filteredPosition}</p>
                  <label htmlFor={`query-key-${managedPiece.id}`}>Key</label>
                  <input
                    id={`query-key-${managedPiece.id}`}
                    className={styles.urlValue}
                    dir="ltr"
                    value={managedPiece.piece.rawKey}
                    readOnly
                  />
                  <label htmlFor={`query-value-${managedPiece.id}`}>
                    {managedPiece.piece.equalsPresent ? "Value" : "Value absent"}
                  </label>
                  <input
                    id={`query-value-${managedPiece.id}`}
                    className={styles.urlValue}
                    dir="ltr"
                    value={managedPiece.piece.rawValue}
                    readOnly
                  />
                </li>
              );
              })}
            </ol>
          </>
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
