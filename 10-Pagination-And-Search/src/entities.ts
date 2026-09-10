import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ nullable: true })
  imagePath!: string | null;

  @Column({ default: 'placeholder' })
  passwordHash!: string;

  @Column({ nullable: true })
  resetToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetExpires!: Date | null;

  @OneToMany(() => Post, (p) => p.author)
  posts!: Post[];
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => User, (u) => u.posts, { eager: true })
  author!: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
