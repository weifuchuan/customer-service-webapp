export default async function retryDo<Result = any>(
  action: () => Promise<Result>,
  retryCount: number = 3
): Promise<Result> {
  if (retryCount > 1) {
    try {
      return await action();
    } catch (err) {
      return await retryDo(action, retryCount - 1);
    }
  } else {
    try {
      return await action();
    } catch (err) {
      throw err;
    }
  }
}