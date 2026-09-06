USE CeylonParadiseDB;
GO

IF COL_LENGTH('dbo.Users', 'phone') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD phone NVARCHAR(30) NULL;
END
GO

IF OBJECT_ID('dbo.RouteInquiries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RouteInquiries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        user_name NVARCHAR(100) NOT NULL,
        user_email NVARCHAR(150) NOT NULL,
        route_json NVARCHAR(MAX) NOT NULL,
        stops_json NVARCHAR(MAX) NULL,
        travelers INT NOT NULL DEFAULT 1,
        status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID('dbo.RouteInquiries', 'U') IS NOT NULL AND COL_LENGTH('dbo.RouteInquiries', 'admin_notes') IS NULL
BEGIN
    ALTER TABLE dbo.RouteInquiries ADD admin_notes NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        message NVARCHAR(500) NOT NULL,
        is_read BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO