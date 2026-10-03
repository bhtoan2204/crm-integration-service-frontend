export function delay(ms = 180) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export class MockServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MockServiceError'
  }
}
