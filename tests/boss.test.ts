import { Boss } from '../src/entities/boss';

test('bone opens a window; hits only land while vulnerable', () => {
  const b = new Boss({ c: 9, r: 9 });
  expect(b.hit()).toBe(false); // not vulnerable yet
  b.onBoneEaten(5);
  expect(b.vulnerable).toBe(true);
  expect(b.hit()).toBe(true);
  expect(b.hp).toBe(2);
  expect(b.vulnerable).toBe(false); // window closes on a hit
});

test('three hits defeat the boss', () => {
  const b = new Boss({ c: 9, r: 9 });
  for (let i = 0; i < 3; i++) {
    b.onBoneEaten(5);
    expect(b.hit()).toBe(true);
  }
  expect(b.defeated).toBe(true);
});

test('the vulnerability window expires on its own', () => {
  const b = new Boss({ c: 9, r: 9 });
  b.onBoneEaten(1);
  b.update(1.1);
  expect(b.vulnerable).toBe(false);
  expect(b.hit()).toBe(false);
});
