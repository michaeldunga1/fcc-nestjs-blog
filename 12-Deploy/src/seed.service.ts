import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Post) private posts: Repository<Post>,
  ) {}

  async onModuleInit() {
    const count = await this.users.count();
    if (count > 0) return;
    const hash = await bcrypt.hash('password123', 10);
    const ada = this.users.create({
      username: 'ada', email: 'ada@example.com', displayName: 'Ada Lovelace', bio: 'First programmer',
      imagePath: null, passwordHash: hash,
    resetToken: null,
    resetExpires: null,
    });
    const grace = this.users.create({
      username: 'grace', email: 'grace@example.com', displayName: 'Grace Hopper', bio: 'Navy admiral',
      imagePath: null, passwordHash: hash,
    resetToken: null,
    resetExpires: null,
    });
    await this.users.save([ada, grace]);
    const rows = [
      this.posts.create({ title: 'Hello from the newsroom', content: 'First post from the teaching seed data.', author: ada, authorId: ada.id }),
      this.posts.create({ title: 'Notes on ownership', content: 'Only the author should edit or delete this post.', author: ada, authorId: ada.id }),
      this.posts.create({ title: 'Second author voice', content: 'Grace owns this post; Ada should get 403 on mutate.', author: grace, authorId: grace.id }),
    ];
    for (let i = 4; i < 12; i++) {
      rows.push(this.posts.create({
        title: `Seed story ${i}`,
        content: `Extra seed content ${i} for pagination.`,
        author: i % 2 === 0 ? ada : grace,
        authorId: i % 2 === 0 ? ada.id : grace.id,
      }));
    }
    await this.posts.save(rows);
  }
}
