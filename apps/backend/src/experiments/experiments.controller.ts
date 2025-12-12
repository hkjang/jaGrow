import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { UpdateExperimentDto } from './dto/update-experiment.dto';

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post()
  create(@Body() createExperimentDto: CreateExperimentDto) {
    return this.experimentsService.create(createExperimentDto);
  }

  @Get()
  findAll() {
    return this.experimentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.experimentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExperimentDto: UpdateExperimentDto) {
    return this.experimentsService.update(id, updateExperimentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.experimentsService.remove(id);
  }

  @Post(':id/assign')
  assignment(@Param('id') id: string, @Body('userId') userId: string) {
    return this.experimentsService.assign(id, userId);
  }
}
