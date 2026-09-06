USE CeylonParadiseDB;
GO

IF COL_LENGTH('dbo.Destinations', 'image_url') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Destinations ALTER COLUMN image_url NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID('dbo.MapPins', 'U') IS NOT NULL AND COL_LENGTH('dbo.MapPins', 'photo_url') IS NULL
BEGIN
    ALTER TABLE dbo.MapPins ADD photo_url NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID('dbo.Reviews', 'U') IS NOT NULL AND COL_LENGTH('dbo.Reviews', 'images_json') IS NULL
BEGIN
    ALTER TABLE dbo.Reviews ADD images_json NVARCHAR(MAX) NULL;
END
GO

PRINT 'Media columns migrated to NVARCHAR(MAX).';
GO
