import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('users')
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column({ default: '' })
  bio: string;

  @Column({ nullable: true })
  imagePath: string | null;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetExpires: Date | null;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
