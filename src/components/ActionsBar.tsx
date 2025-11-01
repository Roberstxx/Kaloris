import React from "react";
import { Undo, Plus, Download, RotateCcw } from "lucide-react";
import styles from "./ActionsBar.module.css";

interface ActionsBarProps {
  onUndo: () => void;
  onManual: () => void;
  onExport: () => void;
  onReset: () => void;
}

export const ActionsBar: React.FC<ActionsBarProps> = ({
  onUndo,
  onManual,
  onExport,
  onReset,
}) => {
  return (
    <div className={styles.bar}>
      <button className="btn btn-secondary" onClick={onUndo}>
        <Undo size={18} /> Deshacer
      </button>
      <button className="btn btn-secondary" onClick={onManual}>
        <Plus size={18} /> Manual
      </button>
      <button className="btn btn-secondary" onClick={onExport}>
        <Download size={18} /> PDF
      </button>
      <button
        className="btn btn-danger"
        onClick={() =>
          window.confirm("¿Resetear el día?") && onReset()
        }
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
};
