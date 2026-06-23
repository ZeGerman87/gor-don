import { swipeToDir } from '../src/core/input';

test('maps a swipe to its dominant-axis direction', () => {
  expect(swipeToDir(50, 5)).toBe('right');
  expect(swipeToDir(-50, 5)).toBe('left');
  expect(swipeToDir(3, -40)).toBe('up');
  expect(swipeToDir(3, 40)).toBe('down');
  expect(swipeToDir(2, 2)).toBe(null); // below threshold
});
