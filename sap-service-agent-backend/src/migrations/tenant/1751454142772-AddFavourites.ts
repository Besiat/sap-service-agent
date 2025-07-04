import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFavourites1751454142772 implements MigrationInterface {
  name = 'AddFavourites1751454142772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "serviceCallId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_72ab0014bdf6d7522571a12397f" UNIQUE ("userId", "serviceCallId"), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e747534006c6e3c2f09939da60" ON "favorites" ("userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e747534006c6e3c2f09939da60"`,
    );
    await queryRunner.query(`DROP TABLE "favorites"`);
  }
}
