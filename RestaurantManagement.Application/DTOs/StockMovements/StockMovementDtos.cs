namespace RestaurantManagement.Application.DTOs.StockMovements;

public sealed record StockMovementDto(
    int MovementId,
    int IngredientId,
    int BatchId,
    string MovementType,
    decimal Quantity,
    string ReferenceType,
    int ReferenceId,
    DateTime MovementDateTime,
    int? CreatedByUserId
);
