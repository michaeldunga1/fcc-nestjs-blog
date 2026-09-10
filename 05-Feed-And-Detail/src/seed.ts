import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Post } from './entities';

export async function seed(app: INestApplication) {
  const users = app.get<Repository<User>>(getRepositoryToken(User));
  const posts = app.get<Repository<Post>>(getRepositoryToken(Post));
  if (await users.count() > 0) return;
  const hash = 'placeholder';
  const ada = users.create({ username: 'ada', email: 'ada@example.com', displayName: 'Ada Lovelace', passwordHash: hash });
  const grace = users.create({ username: 'grace', email: 'grace@example.com', displayName: 'Grace Hopper', passwordHash: hash });
  await users.save([ada, grace]);
  const rows = [
    posts.create({ title: 'Hello from the newsroom', content: 'First post from the teaching seed data.', author: ada }),
    posts.create({ title: 'Notes on ownership', content: 'Only the author should edit or delete this post.', author: ada }),
    posts.create({ title: 'Second author voice', content: 'Grace owns this post; Ada should get 403 on mutate.', author: grace }),
  ];
  for (let i = 4; i < 12; i++) {
    rows.push(posts.create({ title: `Seed story ${i}`, content: `Extra seed content ${i} for pagination.`, author: i % 2 === 0 ? ada : grace }));
  }
  await posts.save(rows);
}
