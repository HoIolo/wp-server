import { IsNotEmpty, IsString } from "class-validator";

export class UpdateArticleTypeDto {

    @IsString()
    @IsNotEmpty()
    name: string
}