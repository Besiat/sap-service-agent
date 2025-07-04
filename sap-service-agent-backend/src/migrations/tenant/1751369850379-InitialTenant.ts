import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMigration1751369850379 implements MigrationInterface {
  name = 'InitMigration1751369850379';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "service_calls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "status" character varying(50) NOT NULL, "scheduledAt" TIMESTAMP NOT NULL, "executedAt" TIMESTAMP, "requestDetails" jsonb NOT NULL, "responseDetails" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_384063fdf80f66e981cf401823a" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "service_calls"`);
  }
}
