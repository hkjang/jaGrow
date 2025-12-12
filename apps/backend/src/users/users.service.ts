import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { organizationId, password, ...userData } = createUserDto;
    if (!password) {
      throw new Error('Password is required');
    }
    return this.prisma.user.create({
      data: {
        ...userData,
        password,
        organization: organizationId
          ? { connect: { id: organizationId } }
          : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: String) {
    return this.prisma.user.findUnique({ where: { id: String(id) } });
  }
  
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  update(id: String, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: String(id) },
      data: updateUserDto,
    });
  }

  remove(id: String) {
    return this.prisma.user.delete({ where: { id: String(id) } });
  }
}
