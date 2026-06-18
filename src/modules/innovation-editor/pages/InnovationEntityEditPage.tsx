import { useParams } from 'react-router-dom';
import { InnovationEditForm } from '../components/InnovationEditForm';
import { InnovationEditShell } from '../components/InnovationEditShell';
import { INNOVATION_ENTITY_ADAPTERS } from '../adapters/entityAdapters';
import { useInnovationEditor } from '../hooks/useInnovationEditor';
import type { InnovationEntityAdapter, InnovationEntityType } from '../types/innovationEditor.types';

interface InnovationEntityEditPageProps {
  entityType: InnovationEntityType;
  entityIdParam?: string;
  projectId?: string | null;
  title: string;
  backTo: string;
  backLabel?: string;
  isAdminContext?: boolean;
}

export function InnovationEntityEditPage({
  entityType,
  entityIdParam,
  projectId = null,
  title,
  backTo,
  backLabel,
  isAdminContext = false,
}: InnovationEntityEditPageProps) {
  const params = useParams();
  const entityId = entityIdParam ?? params.id ?? params.projectId ?? '';
  const adapter = INNOVATION_ENTITY_ADAPTERS[entityType] as InnovationEntityAdapter<unknown>;

  const editor = useInnovationEditor({
    adapter,
    entityId,
    projectId,
    isAdminContext,
  });

  if (!editor.values) {
    return (
      <InnovationEditShell
        title={title}
        backTo={backTo}
        backLabel={backLabel}
        loading={editor.loading}
        error={editor.error}
      >
        {null}
      </InnovationEditShell>
    );
  }

  return (
    <InnovationEditShell
      title={title}
      backTo={backTo}
      backLabel={backLabel}
      loading={editor.loading}
      dirty={editor.dirty}
      saving={editor.saving}
      autosaving={editor.autosaving}
      error={editor.error}
      lastSavedAt={editor.lastSavedAt}
      lastAutosaveAt={editor.lastAutosaveAt}
      canEdit={editor.canEdit}
      onSaveDraft={() => void editor.saveDraft()}
      onPublish={() => void editor.publish()}
      versions={editor.versions}
      activities={editor.activities}
      onRestoreVersion={editor.restoreVersion}
    >
      <InnovationEditForm
        entityType={entityType}
        values={editor.values}
        onChange={editor.setValues}
        disabled={!editor.canEdit || editor.saving}
      />
    </InnovationEditShell>
  );
}
