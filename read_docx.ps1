$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('e:\freo\freo-app\FreoMUN_PRD_v1.docx')
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
Write-Output $text
