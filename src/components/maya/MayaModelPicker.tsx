import { MAYA_MODELS } from '../../lib/maya/constants';
import type { MayaModelId } from '../../lib/maya/types';

interface Props {
  value: MayaModelId;
  onChange: (id: MayaModelId) => void;
  disabled?: boolean;
}

export function MayaModelPicker({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MayaModelId)}
      disabled={disabled}
      style={{
        padding: '0.4rem 0.6rem',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(0,0,0,0.3)',
        color: '#fff',
        fontSize: '0.8rem',
      }}
    >
      {MAYA_MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
