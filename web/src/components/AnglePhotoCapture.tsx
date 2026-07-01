import { useRef } from 'react';
import { ANGLES, type Angle } from '../lib/api';

/**
 * 4-slot capture grid (front / back / left / right). Front is required; the
 * others are optional but encouraged, since more angles give the AI a much
 * better read (and a better cross-angle comparison against your baseline).
 */
const AnglePhotoCapture = ({
  files,
  onChange,
}: {
  files: Partial<Record<Angle, File>>;
  onChange: (angle: Angle, file: File | undefined) => void;
}) => {
  const inputs = useRef<Partial<Record<Angle, HTMLInputElement | null>>>({});

  const pick = (angle: Angle, e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(angle, e.target.files?.[0]);
  };

  return (
    <div className="angle-grid">
      {ANGLES.map(({ id, label }) => {
        const file = files[id];
        const preview = file ? URL.createObjectURL(file) : null;
        return (
          <button
            key={id}
            type="button"
            className={`angle-slot ${file ? 'filled' : ''}`}
            onClick={() => inputs.current[id]?.click()}
          >
            {preview ? (
              <img src={preview} alt={label} />
            ) : (
              <span className="angle-plus">📷</span>
            )}
            <span className="angle-label">
              {label}
              {id === 'front' && !file && ' *'}
            </span>
            <input
              ref={(el) => {
                inputs.current[id] = el;
              }}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: 'none' }}
              onChange={(e) => pick(id, e)}
            />
          </button>
        );
      })}
    </div>
  );
};

export default AnglePhotoCapture;
