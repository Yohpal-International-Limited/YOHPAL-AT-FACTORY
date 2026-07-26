import { BadRequestException, PipeTransform } from '@nestjs/common';

export class OptionalTakePipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value?: string): number | undefined {
    if (value === undefined) return undefined;
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('take must be an integer between 1 and 100');
    }
    const take = Number(value);
    if (take < 1 || take > 100) {
      throw new BadRequestException('take must be an integer between 1 and 100');
    }
    return take;
  }
}

export class RequiredQueryPipe implements PipeTransform<string | undefined, string> {
  constructor(private readonly name: string) {}

  transform(value?: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(`${this.name} is required`);
    }
    return normalized;
  }
}
