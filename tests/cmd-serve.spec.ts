// const mockCommon = jest.fn();
// jest.mock('./common.js', () => ({ defaultPort: 1234, loadModule: mockCommon }));

// import { serve } from './cmd-serve';

// xdescribe('start a local server with a function', () => {
//   it('should start on default port', async () => {
//     const fn = jest.fn();

//     mockCommon.mockReturnValue(fn);

//     const result = await serve({ port: undefined });
//     expect(result).toBe(null);
//     expect(mockCommon).toHaveBeenCalledWith(expect.any(String));
//   });
// });
