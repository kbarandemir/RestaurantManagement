using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStockMovementCreatedByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Users_UserId",
                table: "StockMovements");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "StockMovements",
                newName: "CreatedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_StockMovements_UserId",
                table: "StockMovements",
                newName: "IX_StockMovements_CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Users_CreatedByUserId",
                table: "StockMovements",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Users_CreatedByUserId",
                table: "StockMovements");

            migrationBuilder.RenameColumn(
                name: "CreatedByUserId",
                table: "StockMovements",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_StockMovements_CreatedByUserId",
                table: "StockMovements",
                newName: "IX_StockMovements_UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Users_UserId",
                table: "StockMovements",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
