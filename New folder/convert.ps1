$word = New-Object -ComObject Word.Application
$word.Visible = $false

$files = @(
    "LIVE SESSION GAME B1",
    "Sample Form Submission",
    "Weekly Submissions"
)

foreach ($f in $files) {
    $docPath = "C:\AI-SEO\mission-control\New folder\$f.docx"
    $txtPath = "C:\AI-SEO\mission-control\New folder\$f.txt"
    $doc = $word.Documents.Open($docPath)
    $doc.SaveAs($txtPath, 2)
    $doc.Close()
}

$word.Quit()
