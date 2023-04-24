// import { runFunction } from './cmd-run';
// import { Writable, Readable } from 'stream';
// import { CliInputs } from './options';

// function setup() {
//   const input = new Readable();
//   const output = new Writable();

//   return { input: input as any, output: output as any };
// }

// xdescribe('run a function', () => {
//   it('should run using cli arguments', () => {
//     const { input, output } = setup();
//     const options: CliInputs = { options: {}, params: {}, name: '', inputs: [] };

//     runFunction(options, input, output);
//   });
// });