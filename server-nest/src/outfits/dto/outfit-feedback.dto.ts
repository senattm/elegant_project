import { IsIn } from 'class-validator';

export class OutfitFeedbackDto {
  @IsIn([1, -1])
  feedback: 1 | -1;
}
