/** Vietnamese mirror of content/diets.json (same shape; NutritionScreen picks
 *  by active language). Food terms localized to what Vietnamese kitchens use;
 *  ounces converted to grams. */
export const dietsVi = {
  goal: 'Công thức rất đơn giản: một mức thâm hụt calo vừa phải cộng đủ đạm, theo bất kỳ kiểu ăn nào bạn thực sự duy trì được. Đặt mục tiêu giảm khoảng 0,5–1% cân nặng mỗi tuần; giảm chậm mới giữ được cơ.',
  habits: [
    {
      icon: '🍗',
      title: 'Đạm trước tiên, bữa nào cũng vậy',
      text: 'Nhắm khoảng 1,6–2,2 g đạm cho mỗi kg cân nặng mỗi ngày. Ăn đạm và rau trước, tinh bột sau; bạn sẽ no lâu hơn và năng lượng cũng ổn định hơn.',
    },
    {
      icon: '🚶',
      title: 'Vận động sau khi ăn',
      text: 'Đi bộ 2–5 phút sau bữa ăn giúp giảm rõ rệt mức tăng đường huyết. Kẹt ở bàn làm việc? Hãy nhón gót tại chỗ: mũi chân giữ trên sàn, nâng gót lên rồi hạ xuống. Ngồi làm vẫn hiệu quả.',
    },
    {
      icon: '🥤',
      title: 'Cắt đường và calo từ đồ uống',
      text: 'Chỉ cần nước lọc, cà phê hoặc trà. Tránh nước ngọt và các loại đường cho thêm; riêng thay đổi này đã giải quyết được phần lớn vấn đề.',
    },
    {
      icon: '🥦',
      title: 'Chủ yếu là thực phẩm nguyên bản',
      text: 'Nhiều rau và thực phẩm ít qua chế biến. Khi cắt đồ ăn siêu chế biến, người ta tự nhiên ăn ít đi rõ rệt mà chẳng cần cố gắng.',
    },
    {
      icon: '🔁',
      title: 'Chọn kiểu ăn bạn duy trì được',
      text: 'Keto, nhịn ăn gián đoạn hay ăn theo bữa cố định đều hiệu quả, miễn là bạn giữ đúng các nguyên tắc ở trên. Chế độ ăn tốt nhất là chế độ bạn thực sự theo được lâu dài. Đều đặn quan trọng hơn "hoàn hảo".',
    },
    {
      icon: '😴',
      title: 'Ngủ đủ và đi bộ mỗi ngày',
      text: 'Ngủ 7–9 tiếng và đi bộ đều đặn hàng ngày âm thầm thúc đẩy giảm mỡ và dập tắt cơn thèm ăn. Đừng xem nhẹ hai điều này.',
    },
  ],
  dinnerCarbNote:
    'Một mẹo tùy chọn: ăn ít tinh bột hơn vào bữa tối giúp nhiều người kiểm soát tổng lượng calo dễ hơn. Đây chỉ là mẹo hữu ích, không phải quy tắc. Calo quan trọng hơn nhiều so với thời điểm ăn tinh bột.',
  mealPlans: {
    lean: {
      name: 'Thực đơn mẫu Lean',
      summary: '4 bữa + đồ ăn nhẹ · ít tinh bột và chất béo, nhiều đạm · bữa tối không có tinh bột.',
      meals: [
        { name: 'Bữa sáng', items: '1 phần đạm + 1 phần tinh bột + 1 phần trái cây (ví dụ: 2 quả trứng · nửa cốc yến mạch hoặc 1 lát bánh mì nguyên cám · 1 quả táo)' },
        { name: 'Bữa trưa (×2)', items: 'Mỗi bữa: 1 phần đạm + 1 phần tinh bột + 1 phần rau' },
        { name: 'Bữa tối', items: '1 phần đạm + 1 phần rau (không tinh bột)' },
        { name: 'Đồ ăn nhẹ (ăn đủ, mỗi ngày)', items: '2 quả trứng luộc · nửa quả bơ · một nắm hạnh nhân (hoặc sữa chua Hy Lạp) · 1 quả táo/trái cây' },
      ],
      carbs: 'Gạo lứt nửa cốc · Khoai lang 115 g · Quinoa nửa cốc · Bánh mì nguyên cám 1,5 lát · Mì Ý nguyên cám 2/3 cốc (mỗi phần ~22–25 g)',
    },
    bulk: {
      name: 'Thực đơn mẫu Bulk',
      summary: '5 bữa + đồ ăn nhẹ · cả ba nhóm chất ở mức vừa đến nhiều · mỗi ngày 1 bữa có thịt bò nạc hoặc cá hồi.',
      meals: [
        { name: 'Bữa sáng', items: '1 phần đạm + 1 phần tinh bột + 1 phần trái cây (ví dụ: 3 quả trứng · nửa cốc yến mạch · 1 quả táo)' },
        { name: 'Bữa trưa (×3)', items: 'Mỗi bữa: 1 phần đạm + 1 phần tinh bột + 1 phần rau' },
        { name: 'Bữa tối', items: '1 phần đạm + 1 phần tinh bột + 1 phần rau' },
        { name: 'Đồ ăn nhẹ (ăn đủ, mỗi ngày)', items: '2 quả trứng luộc · nửa quả bơ · một nắm hạnh nhân · 1 quả táo/trái cây' },
      ],
      carbs: 'Gạo lứt 2/3 cốc · Khoai lang 140 g · Quinoa 2/3 cốc · Bánh mì nguyên cám 2 lát · Mì Ý nguyên cám 1 cốc (mỗi phần ~30 g)',
    },
  },
  proteins: 'Ức gà 100 g · Thịt gà tây xay 155 g · Thịt bò nạc 115 g · Cá hồi 155 g · Cá thịt trắng 115 g (mỗi phần ~30 g đạm)',
  veggies: '1 cốc loại nào cũng được (5 cốc rau lá xanh = 1 cốc): măng tây, bông cải xanh, ớt chuông, bắp cải tí hon, rau chân vịt, cải kale, súp lơ trắng, bí ngòi, rau trộn các loại',
  grocery: [
    { group: 'Đạm', items: 'Trứng · Ức gà · Thịt gà tây xay · Thịt bò nạc · Cá hồi · Cá thịt trắng' },
    { group: 'Tinh bột', items: 'Gạo lứt · Khoai lang · Yến mạch · Quinoa · Bánh mì nguyên cám · Mì Ý nguyên cám' },
    { group: 'Rau củ', items: 'Măng tây · Bông cải xanh · Ớt chuông · Bắp cải tí hon · Rau chân vịt · Cải kale · Súp lơ trắng · Bí ngòi · Rau trộn các loại' },
    { group: 'Trái cây', items: 'Táo · Chuối · Các loại quả mọng · Dưa lưới · Dứa · Bưởi' },
    { group: 'Chất béo tốt', items: 'Bơ · Hạnh nhân · Dầu bơ · Dầu ô liu · Dầu dừa · Sữa chua Hy Lạp · Hạt chia' },
  ],
  rules: [
    'Cân thực phẩm sau khi nấu chín (tính bằng gam).',
    'Chỉ nấu với dầu bơ, dầu ô liu hoặc dầu dừa.',
    'Không thêm đường. Hạn chế muối; hãy dùng tiêu, thì là Ai Cập, cà ri và rau thơm.',
    'Chỉ uống nước lọc (cà phê/trà không đường vẫn được).',
    'Nếu thực đơn ghi "hoặc", chọn một trong các lựa chọn.',
    'Ăn đủ các món ăn nhẹ mỗi ngày, chia rải ra trong ngày.',
    'Bữa cuối ăn muộn mấy cũng không sao, miễn là đúng thực đơn.',
  ],
};
