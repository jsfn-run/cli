export const defaultPort = 1234;
export const baseRequestOptions = {
  method: 'POST',
  headers: { 'user-agent': 'node-lambdas/cli' },
  timeout: 30_000,
};

export function readStream(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('error', reject);
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
  });
}

export function loadModule(path: string) {
  return import(path);
}