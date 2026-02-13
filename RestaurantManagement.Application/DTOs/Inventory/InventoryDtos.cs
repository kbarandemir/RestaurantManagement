namespace RestaurantManagement.Application.DTOs.Inventory;

public sealed record InventoryBatchDto(int BatchId, decimal QuantityOnHand, DateTime ReceivedDate, DateTime ExpiryDate, bool IsActive);

public sealed record InventoryIngredientDto(
    int IngredientId,
    string Name,
    string BaseUnit,
    decimal TotalOnHand,
    List<InventoryBatchDto> Batches
);
