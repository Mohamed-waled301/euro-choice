import { RecordModel } from '../models/Record';
import { AppError } from '../middleware/errorHandler';

/**
 * Checks whether adding a dependency from `recordId` to `dependsOnId` would create a circular dependency.
 * If `dependsOnId` is equal to `recordId`, or if `dependsOnId` can already reach `recordId`,
 * adding `recordId -> dependsOnId` forms a cycle.
 */
export async function detectCircularDependency(recordId: string, dependsOnId: string): Promise<void> {
  if (recordId === dependsOnId) {
    throw new AppError('A record cannot depend on itself', 400, 'CIRCULAR_DEPENDENCY');
  }

  // Traverse the dependency tree from dependsOnId to see if it reaches recordId
  const visited = new Set<string>();
  const queue: string[] = [dependsOnId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === recordId) {
      throw new AppError(
        'Circular dependency detected: The target record already depends on this record (directly or transitively)',
        400,
        'CIRCULAR_DEPENDENCY'
      );
    }

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const record = await RecordModel.findById(currentId).select('dependencies');
    if (record && record.dependencies && record.dependencies.length > 0) {
      for (const depId of record.dependencies) {
        const depStr = depId.toString();
        if (!visited.has(depStr)) {
          queue.push(depStr);
        }
      }
    }
  }
}
