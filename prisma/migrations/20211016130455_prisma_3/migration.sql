-- RenameIndex
ALTER INDEX "Company.name_unique" RENAME TO "Company_name_key";

-- RenameIndex
ALTER INDEX "Job.sourceSlug_sourceKey_unique" RENAME TO "Job_sourceSlug_sourceKey_key";

-- RenameIndex
ALTER INDEX "Source.slug_unique" RENAME TO "Source_slug_key";
