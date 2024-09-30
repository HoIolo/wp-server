import { IsString, MaxLength } from "class-validator";

export class CreateArticleTypeDto {
    @IsString()
    @MaxLength(20)
    name: string;
}