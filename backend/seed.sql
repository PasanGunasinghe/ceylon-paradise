USE CeylonParadiseDB;
GO

DELETE FROM dbo.Reviews;
DELETE FROM dbo.Memories;
DELETE FROM dbo.MapPins;
DELETE FROM dbo.BookingInquiries;
DELETE FROM dbo.Destinations;
DELETE FROM dbo.TourPackages;
DELETE FROM dbo.Users;
GO

INSERT INTO dbo.Users (name, email, password, role)
VALUES
  ('Admin User', 'admin@ceylonparadise.com', '$2a$10$lSHyLyWpdtaq4zCAl14M8.CUfSzSaQDLjLj8ucmbE0fXWM8aRyCUe', 'admin'),
  ('Standard User', 'user@ceylonparadise.com', '$2a$10$VLw9UnrNK2geuwrYhOB92ecbavwTatOPL5KwedyONpDLVxwR6UvsC', 'user');
GO

PRINT 'Content tables purged. Default accounts inserted. Admin password: admin123; User password: user123';
GO
