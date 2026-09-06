USE master;
GO

IF DB_ID('CeylonParadiseDB') IS NULL
BEGIN
    CREATE DATABASE CeylonParadiseDB;
END
GO

USE CeylonParadiseDB;
GO

PRINT 'Database CeylonParadiseDB ready.';
GO
