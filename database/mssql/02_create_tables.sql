USE CeylonParadiseDB;
GO

IF OBJECT_ID('dbo.BookingInquiries', 'U') IS NOT NULL
    DROP TABLE dbo.BookingInquiries;
IF OBJECT_ID('dbo.TourPackages', 'U') IS NOT NULL
    DROP TABLE dbo.TourPackages;
IF OBJECT_ID('dbo.Destinations', 'U') IS NOT NULL
    DROP TABLE dbo.Destinations;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'customer'
);
GO

CREATE TABLE dbo.Destinations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    image_url NVARCHAR(MAX),
    location NVARCHAR(150) NOT NULL
);
GO

CREATE TABLE dbo.TourPackages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE dbo.BookingInquiries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_name NVARCHAR(100) NOT NULL,
    user_email NVARCHAR(150) NOT NULL,
    tour_id INT NOT NULL,
    date DATE NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    notes NVARCHAR(MAX),
    CONSTRAINT FK_BookingInquiry_Tour FOREIGN KEY (tour_id) REFERENCES dbo.TourPackages(id)
);
GO

PRINT 'Tables created successfully.';
GO
