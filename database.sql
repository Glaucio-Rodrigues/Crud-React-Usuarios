-- ATENÇÃO: Para aplicar o controle manual de IDs que se reordenam,
-- você precisa executar este script para recriar a tabela. 
-- (Isso irá apagar os dados atuais se a tabela já existir).

CREATE DATABASE Usuarios;
GO

USE Usuarios;
GO

IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL
    DROP TABLE dbo.Usuarios;
GO

-- Criar a tabela Usuarios sem o "IDENTITY" automático, para permitir reordenação manual
-- Limites definidos: Nome (50), Email (70), Cep (Oito números) e Endereco (100)
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY,                       -- ID único, controlado inteiramente pela API
    Nome NVARCHAR(50) NULL,                   -- Limite para texto de até 50 caracteres
    Idade INT NULL,                           -- Apenas números (geralmente gerencia-se o limite de dígitos no front, de até 3)
    Email NVARCHAR(70) NULL,                  -- Limite de até 70 caracteres
    Cep VARCHAR(8) NULL,                      -- Salvando o CEP sem separações (até 8 números como texto para guardar possíveis 0's a esquerda)
    Endereco NVARCHAR(100) NULL               -- Limite de até 100 caracteres contando letras e números
);
GO
